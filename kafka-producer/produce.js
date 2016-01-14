'use strict';

const args = require('yargs').argv;
const async = require('async');

const topic = args.topic;

// Redis
const Redis = require('ioredis');

const redis = new Redis.Cluster([{
  port: 6379,
  host: process.env.REDIS_CONNECTION_1
}, {
  port: 6379,
  host: process.env.REDIS_CONNECTION_2
}, {
  port: 6379,
  host: process.env.REDIS_CONNECTION_3
}]);

if (args.reset) {
  redis.set(topic, 0);
}

// redis.on('error', error => {
//   console.error(error);
// });

// Kafka
const kafka = require('kafka-node');

const connectionString = process.env.KAFKA_CONNECTION; // Otherwise kafka-node will use default value localhost:2181
const clientId = args.id // Otherwise kafka-node will use default value 'kafka-node-client'

const kafkaClient = new kafka.Client(connectionString, clientId);

// Twitter
const Twitter = require('twitter');

const twitterClient = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESSTOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESSTOKEN_SECRET
});

const producer = new kafka.HighLevelProducer(kafkaClient);

let tweetsSinceLastSecond = 0;

function sanitizeKafkaTopic(topic) {
  return topic.replace(/,/g, '-');
}

producer.on('ready', () => {
  console.log('Producer connected');
  producer.createTopics([sanitizeKafkaTopic(topic)], (error, data) => {
    if (error) {
      console.log(`Error creating topic ${topic} with error:\n${error}`);
    }
    console.log(`Topic ${sanitizeKafkaTopic(topic)} created.`);

    twitterClient.stream('statuses/filter', {
      track: topic
    }, stream => {
      stream.on('data', tweet => {
        let success = false;
        let tries = 0;
        async.whilst(() => !success, callback => {
          producer.send([{
            topic: sanitizeKafkaTopic(topic),
            messages: JSON.stringify(tweet),
            attributes: 1 // Use gzip compression
          }], (error, data) => {
            if (error) {
              console.error(`Could not produce tweet:\n${error}\nRetrying...`);
              tries++;
            } else {
              success = true;
            }
            callback();
          });
        }, () => {
          if (tries > 0) {
            console.log(`Produced tweet and recovered from error after ${tries} tries.`);
          }
          redis.incr(topic, error => {
            if (error) {
              console.error(`Error in redis: ${error}`);
            }
          });
          tweetsSinceLastSecond++;
        });
      });

      stream.on('error', error => {
        console.error(error);
      });
    });
  });
});

producer.on('error', error => {
  // console.error(error);
});

setInterval(() => {
  console.log(`Produced ~${tweetsSinceLastSecond}/s`);
  tweetsSinceLastSecond = 0;
}, 1000);

process.on('SIGINT', () => {
  console.log('\nClosing producer connection');
  kafkaClient.close();
  producer.close();
  process.exit();
});
