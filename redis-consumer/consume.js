'use strict';

const moment = require('moment');

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

const redis = new Redis.Cluster(hosts, {
  readOnly: true
});

hosts.filter(host => !host.slave)
  .map(host => new Redis(host))
  .forEach(redis => {

    redis.subscribe('__keyevent@0__:lpush');
    redis.subscribe('__keyevent@0__:zincr');

    redis.on('message', (channel, key) => {
      totalMessages++;
      if (key.indexOf('List') !== -1) {
        updateFromLatestListEntry(key);
      }
    });
  });

// Driver setup
const driverOneKeyPattern = `{${moment().week()}}0:`;
const driverTwoKeyPattern = `{${moment().week()}}1:`;

const drivers = [{
  currentSpeed: 0,
  currentRPM: 0,
  averageSpeed: 0,
  averageRPM: 0
}, {
  currentSpeed: 0,
  currentRPM: 0,
  averageSpeed: 0,
  averageRPM: 0
}];

let totalMessages = 0;
let messagesSinceLastSecond = 0;
let perSecond = 0;
let averageCalculationTime = 0;
setInterval(() => {
  perSecond = totalMessages - messagesSinceLastSecond;
  messagesSinceLastSecond = totalMessages;

  const startTime = new Date().getTime();
  Promise.all([
    updateFromLatestSetIncrease(`${driverOneKeyPattern}speedSet`),
    updateFromLatestSetIncrease(`${driverOneKeyPattern}rpmSet`),
    updateFromLatestSetIncrease(`${driverTwoKeyPattern}speedSet`),
    updateFromLatestSetIncrease(`${driverTwoKeyPattern}rpmSet`)
  ]).then(() => averageCalculationTime = new Date().getTime() - startTime);

}, 1000);

function updateFromLatestListEntry(key) {
  redis.lrange(key, 0, 0)
    .then(message => {
      const driverIndex = key.indexOf(driverOneKeyPattern) !== -1 ? 0 : 1;
      if (key.indexOf('speed') !== -1) {
        drivers[driverIndex].currentSpeed = message[0];
      } else {
        drivers[driverIndex].currentRPM = message[0];
      }
    });
}

function updateFromLatestSetIncrease(key) {
  return redis.zrange(key, 0, Number.MAX_SAFE_INTEGER, 'WITHSCORES')
    .then(message => {
      let average = 0;
      let total = 0;

      for (let i = 0; i < message.length - 2; i = i + 2) {
        const score = parseInt(message[i + 1]);
        average += parseInt(message[i]) * score;
        total += score;
      }
      average = average / total;

      const driverIndex = key.indexOf(driverOneKeyPattern) !== -1 ? 0 : 1;
      if (key.indexOf('speed') !== -1) {
        drivers[driverIndex].averageSpeed = average;
      } else {
        drivers[driverIndex].averageRPM = average;
      }
    });
}

// socket.io
const io = require('socket.io')(3000);
const connections = [];
io.on('connection', socket => {
  connections.push(socket);

  socket.on('disconnect', () => {
    const index = connections.indexOf(socket);
    if (index > -1) {
      connections.splice(index, 1);
    }
  });
});

setInterval(() => {
  connections.forEach(socket => {
    socket.emit('update', {
      drivers: drivers,
      totalMessages: totalMessages,
      perSecond: perSecond,
      averageCalculationTime: averageCalculationTime
    });
  });
}, 16);
