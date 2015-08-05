var express = require('express'),
    fs = require('fs'),
    http = require('http'),
    AWS = require('aws-sdk');

var app = express();
var conf = getConfig();

if (conf) {
  app.get('/', function (req, res) {
    res.send('Hello World ' + conf.port)
  })
  doRequest();
  app.listen(conf.port);
}

function doRequest() {
  var status = false;
  var options = {
    host: conf.host,
    path: '/'
  };

  var req = http.get('http://'+conf.host, function(res) {
    var time = new Date();

    console.log(time.getTime() + " " + res.statusCode);
    if (res.statusCode != 301) {

    }
    else {

    }
    setTimeout(doRequest, conf.timeout * 1000);
  });
}

function configExists() {
  return fs.existsSync(__dirname + '/config');
}

function getConfig() {
  console.log('Loading Config');

  if (configExists()) {
    return require('./config');
  }
  else { 
    console.log('No config, creating one for you');
    fs.createReadStream(__dirname + '/config.sample').pipe(fs.createWriteStream(__dirname + '/config'));
    if (configExists()) {
      return require('./config');
    }
    else {
      console.log('Unable to create/read config.');
      return false;
    }
  }
}
