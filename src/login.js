const electronOauth2 = require('electron-oauth2');
const poster = require('./utils/poster.js');
const loginHandler = require('./utils/loginHandler.js');
const indexImporter = require('../assets/imports.js');
const settings = require('electron-settings');
const electron = require('electron');
const ipc = require('electron').ipcRenderer;

var oauthClient = null;

ipc.on('close', (event, message) => {
    if (settings.get('signedIn'))
        loginHandler.signOut();
});

function bindButtons ()
{
    console.log('Bind');
    if (settings.get('email') == '')
    {
        document.getElementById('button-oauth-signin').innerHTML = 'Sign In with Google';
        document.getElementById('button-oauth-signin').addEventListener('click', loginHandler.signIn);
    }
    else
    {
        document.getElementById('button-oauth-signin').innerHTML = 'Sign Out';
        document.getElementById('button-oauth-signin').addEventListener('click', loginHandler.signOut);
    }
}

module.exports.bindButtons = bindButtons;
module.exports.oauthClient = oauthClient;