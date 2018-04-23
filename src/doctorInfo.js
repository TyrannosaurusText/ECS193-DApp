const settings = require('electron-settings');
const poster = require('./utils/poster.js');

var doctors = [];
var postobj = { 
    authCode: settings.get('authCode') 
};
var patientAmt = 0;
var doctorAmt = 0;
var sectionBtn = null;

function Bind ()
{
    //console.log('BindDoctorInfo');
    sectionBtn = document.getElementById('button-doctor-info');
    sectionBtn.addEventListener('click', GatherDoctors);
}

function GatherDoctors ()
{
    //console.log('Gather');
    poster.post(postobj, '/fetch/doctors', function (resObj) {
        doctors = [];
        Array.prototype.forEach.call(resObj, function (d) {
            doctorAmt++;
            doctors[d.email] = {
                name: d.name,
                patientCount: 0
            };
        });
        //console.log(doctors);
        ReadPatients();
    });
}

function ReadPatients ()
{
    poster.post(postobj, '/fetch/patientMeta', function (resObj) {
        for (var i = 0; i < resObj.meta.length; i++)
        {
            patientAmt++;
            doctors[resObj.meta[i].doctorEmail].patientCount++;
        }
        MakeTable();
    });
}

function MakeTable ()
{
    var avgs = document.getElementById('doctor-info-avgs');
    avgs.innerHTML = 'Number of Doctors: ' + doctorAmt + 
                     '<br>Number of Patients: ' + patientAmt +
                     '<br>Average Patients Per Doctor: ' + (patientAmt / doctorAmt);

    var area = document.getElementById('doctor-info-table-area');
    var table = document.createElement('table');
    table.id = 'doctor-info-table';
    area.appendChild(table);

    var inner = '<tr><th>Doctor Name</th><th>Doctor Email</th><th>Patient Amount</th><th>Remove</th></tr>';
    for (var d in doctors) 
    {
        console.log('Doctor:');
        console.log(d);
        inner += '<tr><td>' + doctors[d].name 
               + '</td><td>' + d 
               + '</td><td>' + doctors[d].patientCount
               + '</td><td><button class="doctor-info-remove-btn" data-email="' + d + '">Remove</button>'
               + '</td></tr>';
    };

    table = document.getElementById('doctor-info-table');
    table.innerHTML = inner;

    var btns = document.getElementsByClassName('doctor-info-remove-btn');
    for (var i = 0; i < btns.length; i++)
    {
        btns[i].addEventListener('click', (event) => {
            var email = event.srcElement.dataset.email;
            console.log('Removing ' + email);
            if (email == settings.get('email'))
                console.log('Cannot remove self');
            else
            {
                //Remove Code
            }
        });
    }
}

module.exports.Bind = Bind;