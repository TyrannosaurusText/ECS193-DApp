const settings = require('electron-settings');
const { ipcRenderer } = require('electron');
const poster = require('../utils/poster.js');

var form = document.getElementById('insert-patient-popup-form');
var btn = document.getElementById('insert-patient-popup-btn');

btn.addEventListener('click', (event) => {
    event.preventDefault();
    var fName = form[0].value;
    var gName = form[1].value;
    var email = form[2].value;

    if (fName == '' || gName == '' || email == '')
    {
        console.log('Must Have All Fields Entered');
        return;
    }

    var postObj = {
        doctorEmail: ipcRenderer.sendSync('ipc-doctor-info-curDoctor', 'get').email,
        recipientEmail: email,
        recipientFamilyName: fName,
        recipientGivenName: gName,
        newAccType: 'patient',
        authCode: settings.get('authCode')
    };

    poster.post(postObj, '/account/sendEmail', emailCB);

    function emailCB (resObj)
    {
        if (!resObj.hasOwnProperty('err'))
            window.close();
    }
});