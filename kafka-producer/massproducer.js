'use strict';

const async = require('async');

// Kafka
const kafka = require('kafka-node');
const connectionString = process.env.KAFKA_CONNECTION; // Otherwise kafka-node will use default value localhost:2181

const Redis = require('ioredis');
const hosts = [{
    port: 6379,host: process.env.REDIS_CONNECTION_1
  }, {
    port: 6379,
    host: process.env.REDIS_CONNECTION_2
  }, {
    port: 6379,
    host: process.env.REDIS_CONNECTION_3
}];
const redis = new Redis.Cluster(hosts);
redis.set('massproduce', 0);

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

const kafkaClient = new kafka.Client(connectionString);
const producer = new kafka.HighLevelProducer(kafkaClient);
const topic = guid();
let messagesSinceLastSecond = 0;
producer.on('ready', () => {
  producer.createTopics([topic], (error, data) => {
    if (error) {
      console.log(`Error creating topic ${topic} with error:\n${error}`);
    }
    setTimeout(() => {
      setInterval(() => {
        let success = false;
        let tries = 0;
        async.whilst(() => !success, callback => {
          producer.send([{
            topic: topic,
            messages: 'What a string',
            attributes: 1 // Use gzip compression
          }], (error, data) => {
            if (error) {
              // console.error(`Could not produce message:\n${error}\nRetrying...`);
              tries++;
            } else {
              redis.incr('massproduce');
              success = true;
            }
            callback();
          });
        }, () => {
          if (tries > 0) {
            // console.log(`Produced message and recovered from error after ${tries} tries.`);
          }
          messagesSinceLastSecond++;
        });
      });
    }, 5000);
  });
});

producer.on('error', () => {

});

// setInterval(() => {
//   console.log(`Produced ~${messagesSinceLastSecond} messages/s`);
//   messagesSinceLastSecond = 0;
// }, 1000);

process.on('SIGINT', () => {
  console.log('\nClosing producer connection');
  kafkaClient.close();
  producer.close();
  redis.disconnect();
  process.exit();
});
