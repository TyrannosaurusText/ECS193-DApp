const settings = require('electron-settings');
const poster = require('./utils/poster.js');
const remote = require('electron').remote;
const BrowserWindow = remote.BrowserWindow;
const ipcMain = remote.ipcMain;
const url = require('url');
const path = require('path');

var doctors = [];
var postobj = { 
    authCode: settings.get('authCode') 
};
var patientAmt = 0;
var doctorAmt = 0;
var sectionBtn = null;
var viewing = '';
var patients = [];
var curPatient = '';

function Bind ()
{
    //console.log('BindDoctorInfo');
    sectionBtn = document.getElementById('button-doctor-info');
    sectionBtn.addEventListener('click', GatherDoctors);

    document.getElementById('doctor-info-back-btn').addEventListener('click', ReturnToList);
    document.getElementById('doctor-info-remove-doc-btn').addEventListener('click', RemoveDoctorPrompt);
}

function GatherDoctors ()
{
    //console.log('Gather');
    patientAmt = 0;
    doctorAmt = 0;

    poster.post(postobj, '/fetch/doctors', function (resObj) {
        doctors = [];

        doctors[''] = {
            familyName: '',
            givenName: '',
            patientCount: 0
        };

        Array.prototype.forEach.call(resObj, function (d) {
            doctorAmt++;
            doctors[d.email] = {
                familyName: d.familyName,
                givenName: d.givenName,
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
            doctors[resObj.meta[i].doctorEmail].patientCount++;
            if (resObj.meta[i].doctorEmail != '')
                patientAmt++;
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

    var inner = '<tr><th>Family Name</th><th>Given Name</th><th>Email</th><th>Patient Amount</th><th></th></tr>';
    for (var d in doctors) 
    {
        if (d == '')
            continue;
        console.log('Doctor:');
        console.log(d);
        inner += '<tr><td>' + doctors[d].familyName 
               + '</td><td>' + doctors[d].givenName
               + '</td><td>' + d 
               + '</td><td>' + doctors[d].patientCount
               + '</td><td><button class="doctor-info-details-btn" data-email="' + d + '">Details</button>'
               + '</td></tr>';
    };

    table = document.getElementById('doctor-info-table');
    table.innerHTML = inner;

    var btns = document.getElementsByClassName('doctor-info-details-btn');
    for (var i = 0; i < btns.length; i++)
    {
        btns[i].addEventListener('click', (event) => {
            var email = event.srcElement.dataset.email;
            document.getElementById('doctor-info-list-view').classList.remove('is-shown');
            SetupDetailedView(email);
            document.getElementById('doctor-info-doctor-view').classList.add('is-shown');
        });
    }
}

function ReturnToList ()
{
    viewing = '';
    GatherDoctors();
    document.getElementById('doctor-info-doctor-view').classList.remove('is-shown');
    document.getElementById('doctor-info-list-view').classList.add('is-shown');
}

function SetupDetailedView (email)
{
    patients = [];
    viewing = email;
    var area = document.getElementById('doctor-info-patient-area');
    var table = document.createElement('table');
    table.id = 'doctor-info-patient-table';
    area.appendChild(table);

    var inner = '<tr><th>ID</th><th>Family Name</th><th>Given Name</th><th>Email</th><th></th><th></th><th></th></tr>';

    poster.post(postobj, '/fetch/patientMeta', function (resObj) {
        for (var i = 0; i < resObj.meta.length; i++)
        {
            var pat = resObj.meta[i];
            if (pat.doctorEmail != email)
                continue;
            patients.push(pat);
            inner += '<tr><td>' + pat.id
                   + '</td><td>' + pat.familyName
                   + '</td><td>' + pat.givenName
                   + '</td><td>' + pat.email
                   + '</td><td><button class="doctor-info-patient-transfer-btn" data-pat=' + JSON.stringify(pat) + '>Transfer</button>'
                   + '</td><td><button class="doctor-info-patient-retire-btn" data-pat=' + JSON.stringify(pat) + '>Retire</button>'
                   + '</td></tr>';
        }

        inner += '<tr><td colspan="6"><button id="doctor-info-patient-insert-btn">Insert</button></td></tr>';

        table = document.getElementById('doctor-info-patient-table');
        table.innerHTML = inner;

        var btns = document.getElementsByClassName('doctor-info-patient-transfer-btn');
        for (var i = 0; i < btns.length; i++)
            btns[i].addEventListener('click', TransferPrompt);
        
        btns = document.getElementsByClassName('doctor-info-patient-retire-btn');
        for (var i = 0; i < btns.length; i++)
            btns[i].addEventListener('click', RetirePatientPrompt);
        
        document.getElementById('doctor-info-patient-insert-btn').addEventListener('click', InsertPatientPrompt);
    });
}

function RemoveDoctorPrompt ()
{
    if (viewing == '')
        return;
    if (patients.length != 0)
    {
        console.log('Please Transfer All Patients Before Removing');
        return;
    }
    console.log('Remove Doctor Prompt');
}

function TransferPrompt (event)
{
    if (viewing == '')
        return;

    curPatient = JSON.parse(event.srcElement.dataset.pat);

    var win = new BrowserWindow({
        width: 600,
        height: 400,
        title: 'Transfer Patient'
    });
    win.loadURL(url.format({
        pathname: path.join(__dirname, '/../view/popups/transferPatient.html'),
        protocol: 'file:',
        slashes: true
    }));
    win.show();
    win.on('close', () => { win = null; });
}

function RetirePatientPrompt (event)
{
    if (viewing == '')
        return;

    curPatient = JSON.parse(event.srcElement.dataset.pat);

    var win = new BrowserWindow({
        width: 600,
        height: 400,
        title: 'Retire Patient'
    });
    win.loadURL(url.format({
        pathname: path.join(__dirname, '/../view/popups/retirePatient.html'),
        protocol: 'file:',
        slashes: true
    }));
    win.show();
    win.on('close', () => { win = null; });
}

function InsertPatientPrompt (event)
{
    if (viewing == '')
        return;

    var win = new BrowserWindow({
        width: 600,
        height: 400,
        title: 'Insert Patient'
    });
    win.loadURL(url.format({
        pathname: path.join(__dirname, '/../view/popups/insertPatient.html'),
        protocol: 'file:',
        slashes: true
    }));
    win.show();
    win.on('close', () => { win = null; });
}

ipcMain.on('ipc-doctor-info-curDoctor', (event, arg) => {
    event.returnValue = viewing;
});

ipcMain.on('ipc-doctor-info-curPatient', (event, arg) => {
    if (arg == 'get')
        event.returnValue = curPatient;
    else if (arg == 'change')
    {
        SetupDetailedView(viewing);
        curPatient = null;
        event.returnValue = null;
    }
    else
    {
        curPatient = null;
        event.returnValue = null;
    }
});

module.exports.Bind = Bind;