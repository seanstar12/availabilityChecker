## High Availability AWS Checker

# Project Specs
Use two (2) aws instances to create a high availability redirect.

# Software
Nginx to create a 301 redirect.

`
  server {
    listen       80;
    server_name  site.gov;
    return       301 http://www.site.gov$request_uri;
  }
`

node.js
  socket on port XXXX 
  ping-pong with timeout

  AWS: http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-intro.html

  Timeout: https://github.com/expressjs/timeout

  Socket: http://www.hacksparrow.com/tcp-socket-programming-in-node-js.html

  Service: http://kvz.io/blog/2009/12/15/run-nodejs-as-a-service-on-ubuntu-karmic/


