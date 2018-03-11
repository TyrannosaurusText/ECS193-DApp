const electronOauth2 = require('electron-oauth2');
const poster = require('./utils/poster.js');
const indexImporter = require('../assets/imports.js');
const settings = require('electron-settings');
const nodemailer = require('nodemailer');
const electron = require('electron');
const url = require('url');
const path = require('path');

var oauthClient = null;
module.exports.oauthClient = oauthClient;

function bindButtons ()
{
    //console.log('Bind');
    document.getElementById('button-oauth-signin').addEventListener('click', signIn);
}

function signIn ()
{
    settings.set('clientID', '671445578517-io87npos82nmk6bk24ttgikc9h4uls4l.apps.googleusercontent.com');
    var config = {
        clientId: settings.get('clientID'),
        authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://www.googleapis.com/oauth2/v4/token',
        useBasicAuthorizationHeader: false,
        redirectUri: 'http://localhost'
    };

    const windowParams = {
        alwaysOnTop: true,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: false
        }
    }

    const options = {
        scope: 'https://www.googleapis.com/auth/userinfo.email',
        accessType: 'offline'
    };

    try {
        oauthClient = electronOauth2(config, windowParams);

        oauthClient.getAccessToken(options)
            .then(function (token) {
                // use your token.access_token 
                console.log(token);
                settings.set('refreshToken', token.refresh_token);
    
                oauthClient.refreshToken(token.refresh_token)
                    .then(function (newToken) {
                        //use your new token
                        console.log(newToken);
                        settings.set('accessToken', newToken.access_token);
    
                        var token = { idToken: newToken.id_token };
                        poster.post(token, '/check/token', tokenCB);

                        var testObj = [];
                        testObj[newToken.access_token] = 'yes';
                        console.log(testObj);
                    });
            });
    }
    catch (e) {
        console.log(e);
    }
}

function tokenCB (res)
{
    res.setEncoding('utf8');
    res.on('data', function (body) {
        console.log(body);
        var resObj = JSON.parse(body);
        settings.set('email', resObj.email);
        settings.set('accType', resObj.accType);
        settings.set('name', resObj.name);
        indexImporter.loadImports();
    });
}

module.exports.bindButtons = bindButtons;
module.exports.oauthClient = oauthClient;