var fs = require('fs'),
    http = require('http'),
    aws = require('aws-sdk');

var conf = getConfig();

if (conf) {
  var metadata = null,
      local_instanceId = null,
      remote_instanceId = null,
      num_remote_instances = 0;

  //doRequest();

    var mds = new aws.MetadataService();
    mds.request('/latest/dynamic/instance-identity/document',function(err,data){
      if(err){ 
        callback(err);  
        return; 
      }
      metadata = JSON.parse(data);
      console.log(metadata);
      
      var as = new aws.AutoScaling({region:metadata.region});
      as.describeAutoScalingInstances({ InstanceIds: [metadata.instanceId]}, function(err, data) {
        console.log(data);
        if (err){
          //handle error
        }
        else if (data.AutoScalingInstances.length != 1 || data.AutoScalingInstances[0].AutoScalingGroupName == undefined) {
          console.log('Instance does not belong to an AutoScaling Group');
        }
        else {
          console.log(data.AutoScalingInstances[0]);
        }
      });
    });
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
