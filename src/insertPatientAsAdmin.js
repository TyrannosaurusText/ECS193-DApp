const electron = require('electron');
const settings = require('electron-settings');
const poster = require('./utils/poster');
const loginHandler = require('./login.js');

var doctorSelect = null;
var insertBtn = null;
var form = null;
var sectionBtn = null;

function Bind ()
{
    //console.log('BindIPAA');
    doctorSelect = document.getElementById('insert-patient-doctor-select');
    insertBtn = document.getElementById('insert-patient-as-admin');
    form = document.getElementById('insert-patient-as-admin-form');
    sectionBtn = document.getElementById('button-insert-patient-as-admin');

    sectionBtn.addEventListener('click', GatherDoctorList);

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
            doctorEmail: '',
            recipientEmail: fEmail,
            recipientName: fName,
            newAccType: 'patient',
            authCode: settings.get('authCode')
        };

        poster.post(postObj, '/account/sendEmail', emailCB);

        function emailCB (resObj)
        {
            var resDiv = document.getElementById('insert-patient-as-admin-response');
            resDiv.innerHTML = JSON.stringify(resObj);
        }
    });
}

function GatherDoctorList () 
{
    var postObj = {
        authCode: settings.get('authCode')
    };

    poster.post(postObj, '/fetch/doctors', function (resObj) {
        console.log(resObj);
        doctorSelect.innerHTML = '';
        Array.prototype.forEach.call(resObj, function (d) {
            var opt = document.createElement('option');
            opt.value = d.email;
            opt.innerHTML = d.name + ' (' + d.email + ')';
            doctorSelect.appendChild(opt);
        });
    });
}

module.exports.Bind = Bind;