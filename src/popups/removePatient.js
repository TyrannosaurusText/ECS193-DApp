const settings = require('electron-settings');
const { ipcRenderer } = require('electron');
const poster = require('../utils/poster.js');

var patInfo = document.getElementById('remove-patient-info');
var ybtn = document.getElementById('remove-patient-ybtn');
var nbtn = document.getElementById('remove-patient-nbtn');
var patient = ipcRenderer.sendSync('ipc-unassigned-curPatient', 'get');

patInfo.innerHTML = 'ID: ' + patient.id + '<br>Name: ' + patient.familyName + ', ' + patient.givenName;

ybtn.addEventListener('click', (event) => {
    event.preventDefault();

    var postobj = {
        authCode: settings.get('authCode'),
        id: patient.id,
        destination: ''
    };

    poster.post(postobj, '/remove/patient', cb);

    function cb (resObj)
    {
        if (!resObj.hasOwnProperty('err'))
        {
            patient = ipcRenderer.sendSync('ipc-unassigned-curPatient', 'change')
            window.close();
        }
    }
});

nbtn.addEventListener('click', (event) => {
    event.preventDefault();
    patient = ipcRenderer.sendSync('ipc-unassigned-curPatient', 'close')
    window.close();
});