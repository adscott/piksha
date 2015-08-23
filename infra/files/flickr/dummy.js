var http = require('http');
var path = require('path');
var express = require('express');
var app = express();

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'responses', req.query.method));
});

http.createServer(app).listen(9999);
