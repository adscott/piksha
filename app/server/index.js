var http = require('http');
var https = require('https');
var fs = require('fs');
var path = require('path');
var express = require('express');
var forceSSL = require('express-force-ssl');

var config = require('/etc/piksha/config');
var clientDir = path.join(__dirname, '../client');


var app = express();

app.set('httpsPort', config.publicHttpsPort);

app.use(forceSSL);
app.use('/react', express.static(path.join(__dirname, '../../node_modules/react/dist/')));
app.use('/client', express.static(path.join(clientDir)));

app.get('/', function (req, res) {
  res.sendFile(path.join(clientDir, 'index.html'));
});

var options = {
  key: fs.readFileSync(config.sslKey),
  cert: fs.readFileSync(config.sslCert)
};

http.createServer(app).listen(config.httpPort);
https.createServer(options, app).listen(config.httpsPort);
