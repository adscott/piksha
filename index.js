var https = require('https');
var fs = require('fs');
var app = require('express')();

var config = require('/etc/piksha/config');

var options = {
  key: fs.readFileSync(config.sslKey),
  cert: fs.readFileSync(config.sslCert)
};

app.get('/', function (req, res) {
  res.send(config.greeting);
});

https.createServer(options, app).listen(config.port);
