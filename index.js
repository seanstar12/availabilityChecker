var fs = require('fs'),
    http = require('http'),
    aws = require('aws-sdk');

var express = require('express');
var app = express();

var conf = getConfig();

if (conf) {
  var metadata = null;
  doRequest();

  app.get('/', function (req, res) {
    var mds = new aws.MetadataService();
    console.log('here');
    mds.request('/latest/dynamic/instance-identity/document',function(err,data){
      if(err){ 
        callback(err);  
        return; 
      }
      metadata = JSON.parse(data);
      console.log('ehere');
    });
    res.send(metadata);
  });
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
