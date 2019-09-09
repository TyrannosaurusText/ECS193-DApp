const settings = require('electron-settings');
const { ipcRenderer } = require('electron');
const poster = require('../utils/poster.js');

var label = document.getElementById('transfer-patient-label');
var select = document.getElementById('transfer-patient-destination');
var btn = document.getElementById('transfer-patient-popup-btn');
var nbtn = document.getElementById('transfer-patient-close-btn');
var patient = ipcRenderer.sendSync('ipc-doctor-info-curPatient', 'get');
var doctor = ipcRenderer.sendSync('ipc-doctor-info-curDoctor', 'get');

function GatherDoctorList ()
{
    var postobj = { 
        authCode: settings.get('authCode') 
    };
    poster.post(postobj, '/fetch/doctors', function (resObj) {
        select.innerHTML = '';
        Array.prototype.forEach.call(resObj, function (d) {
            if (d.email != doctor)
            {
                var opt = document.createElement('option');
                opt.value = d.email;
                opt.innerHTML = d.familyName + ', ' + d.givenName + ' (' + d.email + ')';
                select.appendChild(opt);
            }
        });
    });
}
GatherDoctorList();

btn.addEventListener('click', (event) => {
    event.preventDefault();

    var postobj = {
        authCode: settings.get('authCode'),
        id: patient.id,
        destination: select.value
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