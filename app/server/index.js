var http = require('http');
var https = require('https');
var fs = require('fs');
var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var forceSSL = require('express-force-ssl');
var sass    = require('node-sass');
var neat = require('node-neat');
var winston = require('winston');

var auth = require('./auth');
var media = require('./media');
var eventWriter = require('./event-writer');

var config = require('./config');
var clientDir = path.join(__dirname, '../client');
var sharedDir = path.join(__dirname, '../shared');

winston.level = 'debug';
winston.add(winston.transports.File, { filename: config.logFile });
winston.remove(winston.transports.Console);

var app = express();

app.set('httpsPort', config.publicHttpsPort);

app.use(forceSSL);
app.use(bodyParser.json());
app.use(cookieParser());

app.use('/n-js', express.static(path.join(__dirname, '../../node_modules/n-js/')));
app.use('/lodash', express.static(path.join(__dirname, '../../node_modules/lodash/')));
app.use('/jquery', express.static(path.join(__dirname, '../../node_modules/jquery/dist/')));
app.use('/react', express.static(path.join(__dirname, '../../node_modules/react/dist/')));
app.use('/client', express.static(path.join(clientDir)));
app.use('/shared', express.static(path.join(sharedDir)));

app.get('/', function (req, res) {
  res.sendFile(path.join(clientDir, 'index.html'));
});

app.get('/client/styles/main.css', function (req, res) {
  sass.render({
    file: path.join(clientDir, 'styles/main.scss'),
    includePaths: neat.includePaths,
    outputStyle: 'compressed'
  }, function (err, result) {
    res.set('Content-Type', 'text/css');
    if (err) {
      res.status(500).send('');
    } else {
      res.send(result.css);
    }
  });
});

app.post('/auth', function (req, res) {
  res.clearCookie('key');
  var key = req.body.key;
  if(auth.valid(key)) {
    res.cookie('key', key);
    res.redirect('/api/');
  } else {
    res.status(401).send({message: 'invalid key'});
  }
});

app.all('/api/*', function (req,res,next) {
  if (auth.valid(req.cookies.key)) {
    next();
  } else {
    res.status(401).send({auth: '/auth'});
  }
});

app.get('/api/', function (req, res) {
  res.send({
    user: auth.user(req.cookies.key),
    albums: '/api/albums/'
  });
});

function readModel(res, req) {
  media.read(req.path).then(function (model) {
    res.send(model);
  }, function () {
    res.status(404).send('');
  });
}

app.get('/api/albums', readModel);
app.get('/api/albums/:albumId', readModel);
app.get('/api/photos/:photoId', readModel);

app.post('/api/events', function (req, res) {
  eventWriter.validate(req.body)
    .then(function (result) {
      if (result) {
        return eventWriter.persist(req.body).then(function () { return 200; }, function () { return 500; });
      }
      return 400;
    })
    .then(function(status) { res.status(status).send(''); });
});

media.fetchContent().then(function () {
  http.createServer(app).listen(config.httpPort);
  https.createServer({
    key: fs.readFileSync(config.sslKey),
    cert: fs.readFileSync(config.sslCert),
    ca: fs.readFileSync(config.sslBundle)
  }, app).listen(config.httpsPort);
});

setInterval(media.fetchContent, 24 * 60 * 60 * 1000);
