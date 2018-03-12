const electron = require('electron');
const settings = require('electron-settings');
const poster = require('./utils/poster');
const loginHandler = require('./login.js');

const doctorSelect = document.getElementById('insert-patient-doctor-select');
const insertBtn = document.getElementById('insert-patient');
const form = document.getElementById('insert-patient-form');
const sectionBtn = document.getElementById('button-insert-patient');

insertBtn.addEventListener('click', function (event)
{
    event.preventDefault();
    var fName = form[0].value;
    var fEmail = form[1].value;
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
        newAccType: 'patient',
        accessToken: settings.get('accessToken')
    };

    sendEmail(postObj);
});

function sendEmail (postObj)
{
    if (settings.get('email') == '')
    {
        console.log('Not logged in');
        return;
    }

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

    function emailCB (res) 
    {
        res.setEncoding('utf8');
        res.on('data', function (body) {
            var resDiv = document.getElementById('insert-patient-response');
            resDiv.innerHTML = body;
        });
    }
}