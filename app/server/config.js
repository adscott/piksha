var path = require('path');
var appDir = path.join(__dirname, '../..');
var configPath = process.env.PIKSHA_CONFIG ? path.resolve(appDir, process.env.PIKSHA_CONFIG) : '/etc/piksha/config';

module.exports = require(configPath);
