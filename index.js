var fs = require('fs'),
    http = require('http'),
    request = require('request'),
    Q = require('q'),
    aws = require('aws-sdk');

var timeout = 10;

var metadata = null,
    aws_info = {
      region: null,
      current: null,
      is_master: false,
      net_info: null,
      host: null,
      local_instance: null,
      master_instance: null,      
      instance_ids: [],
      instances: []
    };

  // Gets MetaData then uses info to get the autoscalinginstances
  // then gets the master IP.
_getMetaData()
.then(_getAutoScaling)
.then(_getIpInfo)
.then(_getMaster)
.then(mainLoop);


function mainLoop() {
  console.log('entering main loop');
  setTimeout(function() {
    _check_other_instances()
    .then(function(data){
      console.log(data); 
    });

    mainLoop();
  },5 * 1000);
}

function _getMaster() {
  console.log('entering _getMaster');
  // compare the instances with the master ip and set if master
  if (aws_info.current == aws_info.net_info.InstanceId) {
    aws_info.is_master = true;
    //console.log(aws_info);
    //_remove_elastic_ip(aws_info.net_info);
    //_add_elastic_ip();
    //_get_instance_from_id('i-992a6635').then(function(data) {
    //  console.log(data);
    //  console.log(aws_info);
    //});
  } 
}

function _getIpInfo() {
  console.log('entering _getIpInfo');
  // Get the elastic IP of the master here
  var deferred = Q.defer();
  var ec2 = new aws.EC2({region: aws_info.region}); 
  ec2.describeAddresses({Filters: [{Name:'instance-id', 'Values': aws_info.instance_ids}]}, function (err, instances) {
    if(err) {
      deferred.reject(new Error(err));
    } 
    else if (instances.Addresses.length != 1) {
      deferred.reject(new Error('Elastic IP Error, ' + instances.Addresses.length +' found, expected 1'));
    }
    else {
      aws_info.net_info = instances.Addresses[0];
      aws_info.host = instances.Addresses[0].PublicIp; 
      deferred.resolve(aws_info);
    }
  });
  return deferred.promise;
}

function _getAutoScaling(metaData) {
  console.log('entering _getAutoScaling');
  var deferred = Q.defer();
  var instances = [];
  var local_instance = null;

  var as = new aws.AutoScaling({region:metaData.region});
  as.describeAutoScalingInstances(null, function(err, data) {
    if (err) {
      console.log(err);
      deferred.reject(new Error(err));
    }
    else if (data) {
      // find current instance
      data.AutoScalingInstances.forEach(function(instance, index) {
        if (instance.InstanceId == metaData.instanceId) {
          instance.locaiton = 'local';
          aws_info.region = metaData.region;
          aws_info.instances.push(instance);
          aws_info.instance_ids.push(instance.InstanceId);
          aws_info.current = instance.InstanceId;
          aws_info.local_instance = instance;
        };
      });
      // find all other instances
      data.AutoScalingInstances.forEach(function(instance) {
        if (instance.AutoScalingGroupName == aws_info.local_instance.AutoScalingGroupName &&
            instance.InstanceId != aws_info.local_instance.InstanceId) {
          instance.locaiton = 'remote';
          aws_info.instances.push(instance);
          aws_info.instance_ids.push(instance.InstanceId);
        }
      });

      deferred.resolve(aws_info);
    }
    else {
      deferred.reject(new Error("No AutoScaling Instances"));
    }
  }); 
  return deferred.promise;
}
function _getMetaData() {
  console.log('entering _getMetaData');
  var deferred = Q.defer();
  var mds = new aws.MetadataService();

  metadata = mds.request('/latest/dynamic/instance-identity/document', function(err,data) {
    if (err) {
      console.log(err);
      deferred.reject(new Error(error));
    }
    else {
      deferred.resolve(JSON.parse(data));
    }
  });
  return deferred.promise;
};

function _check_other_instances() {
  console.log('  _check_other_instances');
  var deferred = Q.defer();
  if (!aws_info.is_master) {
    aws_info.instances.forEach(function(instance) {
      if (instance.InstanceId != aws_info.net_info.InstanceId) {
        //need to do requst if NOT master. 
        doRequest()
        .then(function(serverIsDown) {
          if (serverIsDown) {
            console.log('SERVER IS DOWN');
            _remove_elastic_ip().then(function() {
              _add_elastic_ip();
                deferred.resolve('server is down'); 
            });
          }
          else {
            console.log('SERVER IS UP');
            deferred.resolve('server is up'); 
          }
        });
      };
    });
  }
  return deferred.promise;
}

function _remove_elastic_ip() {
  var ec2 = new aws.EC2({region: aws_info.region});
  var params = {
    DryRun: true,
    AssociationId: aws_info.net_info.AssociationId
  }
  ec2.disassociateAddress(params, function(err, data) {
    if (err) {
      console.log(err); 
    }
    else {
      console.log(data);
    }
  });
}

function _add_elastic_ip() {
  var deferred = Q.defer();
  if (!aws_info.is_master) {

  } 
  else {
    console.log('adding ip');
    var params = {
      DryRun: true,
      AllowReassociation: true,
      InstanceId: aws_info.current,
      PublicIp: aws_info.host
    }
    var ec2 = new aws.EC2({region: aws_info.region});
    ec2.associateAddress(params, function(err, data) {
      if (err) {
        console.log(err); 
        deferred.reject(new Error(err));
      }
      else {
        console.log(data);
        deferred.resolve(data); 
      }
    });
  }
  return deferred.promise;
}

function _get_instance_from_id(id) {
  var deferred = Q.defer();
  aws_info.instances.forEach(function(instance) {
    if (instance.InstanceId == id) {
      deferred.resolve(instance);
    } 
  });
  return deferred.promise;
}

function doRequest() {
  console.log('entering doRequest');
  var deferred = Q.defer();
  var options = {
    host: aws_info.host,
    path: '/'
  };
  request(aws_info.host, function(err, resp) {
    var time = new Date();
    console.log(err);
    console.log(time.getTime() + " " + resp.statusCode);
    deferred.resolve(resp.statusCode);

  });

  return deferred.promise;
}

