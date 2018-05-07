const settings = require('electron-settings');
const { ipcRenderer } = require('electron');
const poster = require('../utils/poster.js');

var docInfo = document.getElementById('remove-doctor-info');
var ybtn = document.getElementById('remove-doctor-ybtn');
var nbtn = document.getElementById('remove-doctor-nbtn');
var doctor = ipcRenderer.sendSync('ipc-doctor-info-curDoctor', 'get');

docInfo.innerHTML = 'Name: ' + doctor.familyName + ', ' + doctor.givenName;

ybtn.addEventListener('click', (event) => {
    event.preventDefault();

    var postobj = {
        authCode: settings.get('authCode'),
        email: doctor.email,
        id: doctor.id
    };

    poster.post(postobj, '/remove/doctor', cb);

    function cb (resObj)
    {
        if (!resObj.hasOwnProperty('err'))
        {
            doctor = ipcRenderer.sendSync('ipc-doctor-info-curDoctor', 'change')
            window.close();
        }
    }
});

nbtn.addEventListener('click', (event) => {
    event.preventDefault();
    doctor = ipcRenderer.sendSync('ipc-doctor-info-curDoctor', 'close')
    window.close();
});