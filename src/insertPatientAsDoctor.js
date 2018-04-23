const electron = require('electron');
const settings = require('electron-settings');
const poster = require('./utils/poster');
const loginHandler = require('./login.js');

var insertBtn = null;
var form = null;
var sectionBtn = null;

function Bind ()
{
    //console.log('BindIPAD');
    insertBtn = document.getElementById('insert-patient-as-doctor');
    form = document.getElementById('insert-patient-as-doctor-form');
    sectionBtn = document.getElementById('button-insert-patient-as-doctor');

    insertBtn.addEventListener('click', function (event)
    {
        event.preventDefault();
        var fName = form[0].value;
        var fEmail = form[1].value;
        if (fName == '')
        {
            console.log('Must enter a name.');
            return;
        }
        if (fEmail == '')
        {
            console.log('Must enter an email.');
            return;
        }

        var postObj = {
            recipientEmail: fEmail,
            recipientName: fName,
            newAccType: 'patient',
            authCode: settings.get('authCode')
        };

        poster.post(postObj, '/account/sendEmail', emailCB);

        function emailCB (resObj)
        {
            var resDiv = document.getElementById('insert-patient-as-doctor-response');
            resDiv.innerHTML = JSON.stringify(resObj);
        }
    });
}

module.exports.Bind = Bind;