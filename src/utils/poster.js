const http = require('http');
const https = require('https');
const loginHandler = require('./loginHandler.js');

function post (postobj, postpath, callback)
{
    console.log('Posting to: ' + postpath);
    var response = '';
    var options = {
        //hostname: 'majestic-legend-193620.appspot.com',
        //port: 443,
        hostname: 'localhost',
        port: 8080,
        path: postpath,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    };
    var req = http.request(options, cb);
    //var req = https.request(options, cb);
    req.on('error', function(err) {
        console.log('problem with request: ' + err.message);
    });
    req.write(JSON.stringify(postobj));
    req.end();

    function cb (res) {
        var concat = '';
        res.setEncoding('utf8');
        res.on('data', (body) => {
            //console.log('Data Body:');
            //console.log(body);
            concat += body;
        });
        res.on('end', () => {
            console.log('Recieved:');
            console.log(concat);
            var resObj = JSON.parse(concat);
            if (resObj.hasOwnProperty('err'))
            {
                if (resObj.err == 'Bad Auth')
                {
                    console.log('Bad Auth');
                    loginHandler.signOut();
                }
                else
                    callback(resObj);
            }
            else
                callback(resObj);
        });
    }
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