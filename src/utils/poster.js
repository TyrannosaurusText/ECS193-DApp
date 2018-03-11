var http = require('http');
var https = require('https');

function post (postobj, postpath, callback)
{
    var response = '';
    var options = {
        hostname: 'majestic-legend-193620.appspot.com',
        port: 443,
        //hostname: 'localhost',
        //port: 8080,
        path: postpath,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    };
    //var req = http.request(options, callback);
    var req = https.request(options, callback);
    req.on('error', function(err) {
        console.log('problem with request: ' + err.message);
    });
    req.write(JSON.stringify(postobj));
    req.end();
}

function postWithHost (postobj, host, postpath, callback)
{
    var response = '';
    var options = {
        hostname: host,
        port: 443,
        path: postpath,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    };
    var req = https.request(options, callback);
    req.on('error', function(err) {
        console.log('problem with request: ' + err.message);
    });
    req.write(JSON.stringify(postobj));
    req.end();
}

module.exports.post = post;
module.exports.postWithHost = postWithHost;