var https = require('https');
var fs = require('fs');
var path = require('path');
var express = require('express');
var app = express();
var config = require('/etc/piksha/config');
var clientDir = path.join(__dirname, '../client');
var options = {
  key: fs.readFileSync(config.sslKey),
  cert: fs.readFileSync(config.sslCert)
};

app.use('/react', express.static(path.join(__dirname, '../../node_modules/react/dist/')));
app.use('/client', express.static(path.join(clientDir)));
app.get('/', function (req, res) {
  res.sendFile(path.join(clientDir, 'index.html'));
});

https.createServer(options, app).listen(config.port);
