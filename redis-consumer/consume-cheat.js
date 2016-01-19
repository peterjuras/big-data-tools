'use strict';

const averageScript = require('./lua');
const moment = require('moment');

// Redis
const Redis = require('ioredis');
const hosts = [{
  port: 6379,
  host: process.env.REDIS_CONNECTION_1
}];

const redis = new Redis.Cluster(hosts, {
  readOnly: true
});
// Upload LUA script to calculate average from a sorted set
let averageScriptHash;
redis.script('LOAD', averageScript)
  .then(scriptHash => {
    averageScriptHash = scriptHash;
  });

const redisSub = new Redis.Cluster(hosts);
redisSub.subscribe('zincr');
redisSub.subscribe('lpush');

redisSub.on('message', (channel, message) => {
  totalMessages++;
  if (channel === 'lpush') {
    updateFromLatestListEntry(JSON.parse(message));
  }
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
  getAverages().then(() => averageCalculationTime = new Date().getTime() - startTime);
}, 1000);

function updateFromLatestListEntry(message) {
  const key = message.key
  const value = message.value;
  const driverIndex = key.indexOf(driverOneKeyPattern) !== -1 ? 0 : 1;
  if (key.indexOf('speed') !== -1) {
    drivers[driverIndex].currentSpeed = value;
  } else {
    drivers[driverIndex].currentRPM = value;
  }
}

function getAverages() {
  return redis
    .evalsha(averageScriptHash,
      4,
      `${driverOneKeyPattern}speedSet`,
      `${driverOneKeyPattern}rpmSet`,
      `${driverTwoKeyPattern}speedSet`,
      `${driverTwoKeyPattern}rpmSet`,
      0,
      Number.MAX_SAFE_INTEGER,
      'WITHSCORES'
    )
    .then(averages => {
      drivers[0].averageSpeed = averages[0];
      drivers[0].averageRPM = averages[1];
      drivers[1].averageSpeed = averages[2];
      drivers[1].averageRPM = averages[3];
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
