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
  host: process.env.REDIS_CONNECTION_4
}, {
  port: 6379,
  host: process.env.REDIS_CONNECTION_5
}, {
  port: 6379,
  host: process.env.REDIS_CONNECTION_6
}];

// Driver setup
const args = require('yargs').argv;
const moment = require('moment');

const driver = args.driver || 0;
const redis = new Redis.Cluster(hosts);

const speedListKey = `{${moment().week()}-${driver}}:speedList`;
const speedSetKey = `{${moment().week()}-${driver}}:speedSet`;
const rpmListKey = `{${moment().week()}-${driver}}:rpmList`;
const rpmSetKey = `{${moment().week()}-${driver}}:rpmSet`;

// Simulate speed
const vmax = 330;
const curve = 110;
const lowRPM = 4000;
const maxRPM = 18000;
const diffRPM = maxRPM - lowRPM;
const breakTime = 2000;

const zeroTo100 = 1700;
const hundredTo200 = 3800 - zeroTo100;
const twoHundredTo300 = 8600 - hundredTo200 - zeroTo100;
const over300 = 5000;

let startTime = new Date().getTime();
let accelerating = true;
let currentSpeed = 0;
let currentThreshold = 0;
let currentRPM = 0;

function getCurrentSpeed() {
  if (accelerating) {
    if (currentSpeed < 100) {
      currentSpeed = ((new Date().getTime() - startTime) / zeroTo100) * 100;
      if (currentSpeed >= 100) {
        startTime = new Date().getTime();
      }
    } else if (currentSpeed < 200) {
      currentSpeed = 100 + ((new Date().getTime() - startTime) / hundredTo200) * 100;
      if (currentSpeed >= 200) {
        startTime = new Date().getTime();
      }
    } else if (currentSpeed < 300) {
      currentSpeed = 200 + ((new Date().getTime() - startTime) / twoHundredTo300) * 100;
      if (currentSpeed >= 300) {
        startTime = new Date().getTime();
      }
    } else if (currentSpeed < vmax) {
      currentSpeed = 300 + ((new Date().getTime() - startTime) / over300) * 100;
    } else {
      accelerating = false;
      startTime = new Date().getTime();
      currentThreshold = 100;
    }
  } else {
    if (currentSpeed > curve) {
      currentSpeed = vmax - (((new Date().getTime() - startTime) / breakTime) * curve);
    } else {
      accelerating = true;
      startTime = new Date().getTime();
    }
  }
  currentSpeed = Math.floor(currentSpeed);
  return currentSpeed;
}

function getCurrentRPM(speed) {
  let gear = parseInt(speed / 50);
  if (gear < 1) {
    return (speed / 50) * maxRPM;
  } else {
    return lowRPM + (speed % 50 / 50) * diffRPM;
  }
}

setInterval(() => {
  const currentSpeed = getCurrentSpeed();
  const currentRPM = getCurrentRPM(currentSpeed);

  redis.lpush(speedListKey, currentSpeed);
  redis.lpush(rpmListKey, currentRPM);

  redis.zincrby(speedSetKey, 1, currentSpeed);
  redis.zincrby(rpmSetKey, 1, currentRPM);
});
