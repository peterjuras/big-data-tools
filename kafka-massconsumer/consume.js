'use strict';

// Redis
const Redis = require('ioredis');
const hosts = [{
  port: 6379,
  host: process.env.REDIS_CONNECTION_1
}, {
  port: 6379,
  host: process.env.REDIS_CONNECTION_2
}, {
  port: 6379,
  host: process.env.REDIS_CONNECTION_3
}, {
  port: 6379,
  host: process.env.REDIS_CONNECTION_4,
  slave: true
}, {
  port: 6379,
  host: process.env.REDIS_CONNECTION_5,
  slave: true
}, {
  port: 6379,
  host: process.env.REDIS_CONNECTION_6,
  slave: true
}];
const redis = hosts.filter(host => !host.slave).map(host => new Redis(host));
const redisCluster = new Redis.Cluster(hosts);

redis.forEach(redis => redis.psubscribe('__keyevent@0__:incrby'));

let totalPublished = 0;
let publishedSinceLastSecond = 0;
let perSecond = 0;

setInterval(() => {
  perSecond = totalPublished - publishedSinceLastSecond;
  publishedSinceLastSecond = totalPublished;
}, 1000);

// socket.io
const io = require('socket.io')(3000);
io.on('connection', socket => {
  redis.forEach(redis => redis.on('pmessage', (channel, msg, pattern) => {
    if (msg.indexOf('incrby') != -1) {
      redisCluster.get('massproduce', (error, value) => {
        totalPublished = value;
        socket.emit('produced', {
          produced: value,
          perSecond: perSecond
        });
      });
    }
  }));

  socket.on('disconnect', () => {
    redis.forEach(redis => redis.disconnect());
    redisCluster.disconnect();
  });
});

// React to CTRL + C
process.on('SIGINT', () => {
  console.log('\nShutting down the redis connections');

  redis.forEach(redis => redis.disconnect());
  redisCluster.disconnect();

  process.exit();
});
