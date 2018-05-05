const settings = require('electron-settings');
const { ipcRenderer } = require('electron');
const poster = require('../utils/poster.js');

var adminInfo = document.getElementById('remove-admin-info');
var ybtn = document.getElementById('remove-admin-ybtn');
var nbtn = document.getElementById('remove-admin-nbtn');
var admin = ipcRenderer.sendSync('ipc-admin-info-curAdmin', 'get');

adminInfo.innerHTML = 'Name: ' + admin.familyName + ', ' + admin.givenName;

ybtn.addEventListener('click', (event) => {
    event.preventDefault();

    var postobj = {
        authCode: settings.get('authCode'),
        email: admin.email
    };

    poster.post(postobj, '/remove/admin', cb);

    function cb (resObj)
    {
        if (!resObj.hasOwnProperty('err'))
        {
            admin = ipcRenderer.sendSync('ipc-admin-info-curAdmin', 'change')
            window.close();
        }
    }
});

nbtn.addEventListener('click', (event) => {
    event.preventDefault();
    admin = ipcRenderer.sendSync('ipc-admin-info-curAdmin', 'close')
    window.close();
});