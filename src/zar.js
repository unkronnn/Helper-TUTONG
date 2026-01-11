// src/zar.js
require('dotenv').config({ quiet: true });
const { ClusterManager } = require('discord-hybrid-sharding');
const path = require('path');
const logger = require('./console/logger');
const config = require('./config/config.json');

// Clear console on startup
console.clear();

const manager = new ClusterManager(
  path.join(__dirname, 'index.js'),
  {
    totalShards: 'auto',
    shardsPerClusters: 2,
    totalClusters: 'auto',
    mode: 'process',
    token: process.env.TOKEN
  }
);

manager.on('clusterCreate', cluster => {
  logger.info(`Cluster ${cluster.id} created`);
});

manager.spawn({ timeout: -1 });


