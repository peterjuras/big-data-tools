'use strict';

const args = require('yargs').argv;
const async = require('async');

// Kafka
const kafka = require('kafka-node');
const connectionString = process.env.KAFKA_CONNECTION; // Otherwise kafka-node will use default value localhost:2181

const kafkaClient = new kafka.Client(connectionString);

const producer = new kafka.HighLevelProducer(kafkaClient);
const topic = args.topic || 'mass';

let messagesSinceLastSecond = 0;
let produce = true;

producer.on('ready', () => {
  console.log('Producer connected');
  producer.createTopics([topic], (error, data) => {
    if (error) {
      console.log(`Error creating topic ${topic} with error:\n${error}`);
    }
    console.log(`Topic ${topic} created.`);

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
            console.error(`Could not produce message:\n${error}\nRetrying...`);
            tries++;
          } else {
            success = true;
          }
          callback();
        });
      }, () => {
        if (tries > 0) {
          console.log(`Produced message and recovered from error after ${tries} tries.`);
        }
        messagesSinceLastSecond++;
      });
    });
  });
});

producer.on('error', error => {
  // console.error(error);
});

setInterval(() => {
  console.log(`${args.id ? `Producer #${args.id}: ` : ''}Produced ~${messagesSinceLastSecond} messages/s`);
  messagesSinceLastSecond = 0;
}, 1000);

process.on('SIGINT', () => {
  console.log('\nClosing producer connection');
  produce = false;
  kafkaClient.close();
  producer.close();
  process.exit();
});
