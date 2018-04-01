const electron = require('electron');
const settings = require('electron-settings');
const poster = require('./utils/poster');
const loginHandler = require('./login.js');

const insertBtn = document.getElementById('insert-faculty');
const form = document.getElementById('insert-faculty-form');

insertBtn.addEventListener('click', function (event)
{
    event.preventDefault();
    var fName = form[0].value;
    var fEmail = form[1].value;
    var fAccType = form[2].value;

    if (fName == '')
    {
        console.log('Must enter a name.');
        return;
    }
    if (fEmail == '')
    {
        console.log('Must enter an email.');
        return;
    }

    var postObj = {
        recipientEmail: fEmail,
        recipientName: fName,
        newAccType: fAccType,
        authCode: settings.get('authCode')
    };

    poster.post(postObj, '/account/sendEmail', emailCB);

    function emailCB (cbRes)
    {
        cbRes.setEncoding('utf8');
        cbRes.on('data', (cbBody) => {
            var resDiv = document.getElementById('insert-faculty-response');
            resDiv.innerHTML = body;
        });
    }

    //sendEmail(postObj);
});

function sendEmail (postObj)
{
    var validateTokenLink = '/oauth2/v1/tokeninfo?access_token=' + settings.get('accessToken');
    poster.postWithHost({}, 'www.googleapis.com', validateTokenLink, tokenValidateForEmail);

    function tokenValidateForEmail (res)
    {
        res.setEncoding('utf8');
        res.on('data', function (body) {
            var gRet = JSON.parse(body);
            console.log(gRet);
            var flag = gRet.hasOwnProperty('error');
            if (!flag)
                if (gRet.expires_in < 10)
                    flag = true;

            if (flag)
            {
                loginHandler.oauthClient.refreshToken(settings.get('refreshToken'))
                    .then(function (newToken) {
                        settings.set('accessToken', newToken.access_token);
                        postObj.accessToken = settings.get('accessToken');
                        poster.post(postObj, '/token/sendEmail', emailCB)
                    });
            }
            else
            {
                poster.post(postObj, '/token/sendEmail', emailCB)
            }
        });
    }

    poster.post(postObj, '/token/sendEmail', emailCB)

    function emailCB (res) 
    {
        res.setEncoding('utf8');
        res.on('data', function (body) {
            var resDiv = document.getElementById('insert-faculty-response');
            resDiv.innerHTML = body;
        });
    }
}