'use strict';

const moment = require('moment');
const redisInstances = 3;

module.exports = function getPartition(driver) {
  return (moment().week() + driver) % redisInstances;
}
