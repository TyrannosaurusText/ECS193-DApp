const electronOauth2 = require('electron-oauth2');
const poster = require('./poster.js');
const indexImporter = require('../../assets/imports.js');
const settings = require('electron-settings');

var oauthClient = null;

function signIn ()
{
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
            .then(function (tokens) {
                console.log('Tokens:');
                console.log(tokens);

                var token = {accessToken: tokens.access_token};
                poster.post(token, '/security/getAuth', authCB);

                var testObj = [];
                testObj[tokens.access_token] = '';
                //console.log(testObj);
            });
    }
    catch (e) {
        console.log(e);
    }

    function authCB (resObj)
    {
        console.log(resObj);
        if (!resObj.hasOwnProperty('err'))
        {
            settings.set('email', resObj.email);
            settings.set('accType', resObj.accType);
            settings.set('name', resObj.name);
            settings.set('authCode', resObj.authCode);
            settings.set('signedIn', true);
            indexImporter.loadImports();
            oauthClient = null;
        }
        else
            console.log('Error: ' + body);
    }
}

function signOut ()
{
    var postObj = {
        email: settings.get('email'),
        authCode: settings.get('authCode'),
        accType: settings.get('accType')
    };
    poster.post(postObj, '/security/revokeAuth', revokeCB);

    function revokeCB (resObj)
    {
        settings.set('authCode', '');
        settings.set('email', '');
        settings.set('accType', '');
        settings.set('name', '');
        settings.set('signedIn', false);
    
        indexImporter.loadImports();
    }
}

module.exports.oauthClient = oauthClient;
module.exports.signIn = signIn;
module.exports.signOut = signOut;