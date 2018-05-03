const poster = require('./utils/poster.js');
const loginHandler = require('./utils/loginHandler.js');
const settings = require('electron-settings');
const ipc = require('electron').ipcRenderer;
const remote = require('electron').remote;
const BrowserWindow = remote.BrowserWindow;
const ipcMain = remote.ipcMain;
const url = require('url');
const path = require('path');

var sectionBtn = null;

ipc.on('close', (event, message) => {
    if (settings.get('signedIn'))
        loginHandler.signOut();
});

function bindButtons ()
{
    sectionBtn = document.getElementById('button-landing');
    sectionBtn.addEventListener('click', CreateInterface);

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

    CreateInterface();
}

function CreateInterface ()
{
    if (settings.get('accType') == 'doctor' || settings.get('accType') == 'adminDoctor')
    {
        var postobj = { 
            authCode: settings.get('authCode') 
        };

        var area = document.getElementById('landing-patient-area');
        var tableHeader = document.createElement('h3');
        tableHeader.innerHTML = 'Patients';
        var table = document.createElement('table');
        table.id = 'landing-patient-table';
        area.innerHTML = '';
        area.appendChild(tableHeader);
        area.appendChild(table);
    
        var inner = '<tr><th>ID</th><th>Family Name</th><th>Given Name</th><th>Email</th></tr>';
    
        poster.post(postobj, '/fetch/patientMeta', function (resObj) {
            for (var i = 0; i < resObj.meta.length; i++)
            {
                var pat = resObj.meta[i];
                if (pat.doctorEmail != settings.get('email'))
                    continue;
                inner += '<tr><td>' + pat.id
                       + '</td><td>' + pat.familyName
                       + '</td><td>' + pat.givenName
                       + '</td><td>' + pat.email;
                       + '</td></tr>';
            }
    
            table = document.getElementById('landing-patient-table');
            table.innerHTML = inner;
        });
    }
}

module.exports.bindButtons = bindButtons;