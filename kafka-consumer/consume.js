'use strict';

const topicSubscribers = {};

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

const redisGet = new Redis.Cluster(hosts);

const totalPublished = {};
const status = {};
const targets = ['0', '1', '2'];

redis.forEach(redis => redis.psubscribe('__keyevent@0__:incrby'));

// Kafka
const kafka = require('kafka-node');
const connectionString = process.env.KAFKA_CONNECTION; // Otherwise kafka-node will use default value localhost:2181

const kafkaClients = {};
const kafkaConsumers = {};
const consumed = {};

function getBrokerId(hostname) {
  if (hostname.indexOf('10-155-208-206') != -1) {
    return 0;
  } else if (hostname.indexOf('10-155-208-205') != -1) {
    return 1;
  } else if (hostname.indexOf('10-155-208-204') != -1) {
    return 2;
  }
}

const msgs = {};

const messageBuffer = {};

// socket.io
const io = require('socket.io')(3000);
io.on('connection', socket => {
  socket.on('subscribe', message => {
    if (!message || message === '') {
      return;
    }
    socket.join(message);
    let totalPublished = 0;
    if (!topicSubscribers[message]) {
      topicSubscribers[message] = [];
      const kafkaClient = new kafka.Client(connectionString);
      const kafkaConsumer = new kafka.HighLevelConsumer(kafkaClient, [{
        topic: message,
      }], {
        fromOffset: false
      });

      redis.forEach(redis => redis.on('pmessage', (channel, msg, pattern) => {
        if (msg.indexOf('incrby') != -1) {
          redisGet.get(message, (error, value) => {
            io.to(message).emit(`published:${message}`, value);
          });
        }
      }));

      kafkaConsumer.on('message', tweet => {
        if (!consumed[message]) {
          consumed[message] = {};
        }
        if (!consumed[message][tweet.partition]) {
          consumed[message][tweet.partition] = 0;
        }
        consumed[message][tweet.partition]++;
        const kafkaClientJson = {
          brokers: [],
          topicMetadata: kafkaClient.topicMetadata[message],
          consumed: consumed[message],
          status: status
        };

        Object.keys(kafkaClient.brokers).forEach(key => {
          const broker = kafkaClient.brokers[key];
          kafkaClientJson.brokers.push({
            host: broker.host,
            id: getBrokerId(broker.host)
          });
        });

        const msg = {
          kafka: kafkaClientJson,
          tweet: tweet
        }

        io.to(message).emit('tweet', msg);
      });
      kafkaConsumer.on('error', error => {
        console.error(error);
      });
      kafkaClients[message] = kafkaClient;
      kafkaConsumers[message] = kafkaConsumer;
      console.log('Consumer created');
    }
    topicSubscribers[message].push(socket.id);
  });

  socket.on('disconnect', () => {
    Object.keys(topicSubscribers).forEach(topic => {
      if (!topicSubscribers[topic]) {
        return;
      }
      const index = topicSubscribers[topic].indexOf(socket.id);
      if (index !== -1) {
        topicSubscribers[topic].splice(index, 1);
      }
      if (topicSubscribers[topic].length === 0) {
        topicSubscribers[topic] = undefined;
        kafkaConsumers[topic].close(() => {
          console.log('Closed consumer connection');
        });
        kafkaConsumers[topic] = undefined;

        kafkaClients[topic].close(() => {
          console.log('Closed client connection');
        });
        kafkaClients[topic] = undefined;
      }
    });
  });
});

// React to CTRL + C
process.on('SIGINT', () => {
  console.log('\nShutting down remaining kafka consumers');

  Object.keys(topicSubscribers).forEach(topic => {
    if (!topicSubscribers[topic]) {
      return;
    }
    topicSubscribers[topic] = undefined;
    kafkaConsumers[topic].close(() => {
      console.log('Closed consumer connection');
    });
    kafkaConsumers[topic] = undefined;

    kafkaClients[topic].close(() => {
      console.log('Closed client connection');
    });
    kafkaClients[topic] = undefined;
  });

  redis.forEach(redis => redis.disconnect());

  process.exit();
});
