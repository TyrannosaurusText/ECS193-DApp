const settings = require('electron-settings');
const { ipcRenderer } = require('electron');
const poster = require('../utils/poster.js');

var patInfo = document.getElementById('retire-patient-info');
var ybtn = document.getElementById('retire-patient-ybtn');
var nbtn = document.getElementById('retire-patient-nbtn');
var patient = ipcRenderer.sendSync('ipc-doctor-info-curPatient', 'get');

patInfo.innerHTML = 'ID: ' + patient.id + '<br>Name: ' + patient.familyName + ', ' + patient.givenName;

ybtn.addEventListener('click', (event) => {
    event.preventDefault();

    var postobj = {
        authCode: settings.get('authCode'),
        id: patient.id,
        destination: ''
    };

    poster.post(postobj, '/transfer/patient', cb);

    function cb (resObj)
    {
        if (!resObj.hasOwnProperty('err'))
        {
            patient = ipcRenderer.sendSync('ipc-doctor-info-curPatient', 'change')
            window.close();
        }
    }
});

nbtn.addEventListener('click', (event) => {
    event.preventDefault();
    patient = ipcRenderer.sendSync('ipc-doctor-info-curPatient', 'close')
    window.close();
});