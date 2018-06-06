const settings = require('electron-settings');
const poster = require('./utils/poster.js');
const remote = require('electron').remote;
const BrowserWindow = remote.BrowserWindow;
const ipcMain = remote.ipcMain;
const url = require('url');
const path = require('path');
const moment = require('moment');

var doctors = [];
var postobj = null;
var patientAmt = 0;
var doctorAmt = 0;
var sectionBtn = null;
var viewing = '';
var patients = [];
var curPatient = null;

function Bind ()
{
    window.$ = window.jQuery = require('jquery');

    //console.log('BindDoctorInfo');
    sectionBtn = document.getElementById('button-doctor-info');
    sectionBtn.addEventListener('click', GatherDoctors);

    document.getElementById('doctor-info-back-btn').addEventListener('click', ReturnToListBtn);
    document.getElementById('doctor-info-remove-doc-btn').addEventListener('click', RemoveDoctorPrompt);

    postobj = { authCode: settings.get('authCode') };
}

function GatherDoctors ()
{
    if (viewing != '')
        ReturnToList('GatherDoctors');

    patientAmt = 0;
    doctorAmt = 0;

    poster.post(postobj, '/fetch/doctors', function (resObj) {
        doctors = [];

        doctors[''] = {
            id: 0,
            familyName: '',
            givenName: '',
            patientCount: 0,
            lastLogin: '',
            lastLoginTime: '',
            accType: ''
        };

        Array.prototype.forEach.call(resObj, function (d) {
            doctorAmt++;
            doctors[d.email] = {
                id: d.id,
                familyName: d.familyName,
                givenName: d.givenName,
                patientCount: 0,
                lastLogin: d.lastLogin.substring(0, 10),
                lastLoginTime: d.lastLogin.substring(11, 19),
                accType: d.accType
            };
        });
        
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
    area.innerHTML = '';
    area.appendChild(table);

    var inner = '<thead><tr><th>Family Name</th><th>Given Name</th><th>Email</th><th>Patient Amount</th><th></th></tr></thead><tbody>';
    for (var d in doctors) 
    {
        if (d == '')
            continue;
        var doc = {
            id: doctors[d].id,
            familyName: doctors[d].familyName,
            givenName: doctors[d].givenName,
            email: d,
            lastLogin: doctors[d].lastLogin,
            lastLoginTime: doctors[d].lastLoginTime,
            accType: doctors[d].accType
        };
        inner += '<tr><td>' + doctors[d].familyName 
               + '</td><td>' + doctors[d].givenName
               + '</td><td>' + d 
               + '</td><td>' + doctors[d].patientCount;
        if (settings.get('accType') == 'admin' || settings.get('accType') == 'adminDoctor')
            inner += '</td><td><button class="doctor-info-details-btn" data-info=' + JSON.stringify(doc) + '>Details</button>';
        else
            inner += '</td><td>';
        inner += '</td></tr>';
    };
    inner += '</tbody>';

    table = document.getElementById('doctor-info-table');
    table.innerHTML = inner;

    var btns = document.getElementsByClassName('doctor-info-details-btn');
    for (var i = 0; i < btns.length; i++)
    {
        btns[i].addEventListener('click', (event) => {
            //console.log(event.srcElement.dataset.info);
            var data = JSON.parse(event.srcElement.dataset.info);
            document.getElementById('doctor-info-list-view').classList.remove('is-shown');
            SetupDetailedView(data);
            document.getElementById('doctor-info-doctor-view').classList.add('is-shown');
        });
    }

    $('#doctor-info-table').dataTable();
}

function ReturnToListBtn () { ReturnToList('Button'); }
function ReturnToList (source)
{
    viewing = null;
    if (source != 'GatherDoctors')
        GatherDoctors();
    document.getElementById('doctor-info-doctor-view').classList.remove('is-shown');
    document.getElementById('doctor-info-list-view').classList.add('is-shown');
}

function MakeAdmin ()
{
    if (viewing == null)
        return;
    var makeAdminObj = {
        authCode: settings.get('authCode'),
        email: viewing.email,
        accType: 'adminDoctor'
    };
    poster.post(makeAdminObj, '/modify/faculty', modifyCB);

    function modifyCB (resObj)
    {
        if (resObj.hasOwnProperty('body'))
        {
            doctors[viewing.email].accType = 'adminDoctor';
            viewing.accType = 'adminDoctor';
            SetupDetailedView(viewing);
        }
    }
}

function SetupDetailedView (doctor)
{
    var makeAdminDiv = document.getElementById('doctor-info-add-admin-btn-area');
    makeAdminDiv.innerHTML = '';
    if (doctor.accType == 'doctor')
    {
        makeAdminDiv.innerHTML = '<button id="doctor-info-add-admin-btn">Make Admin</button>'
        document.getElementById('doctor-info-add-admin-btn').addEventListener('click', MakeAdmin);
    }

    var lastLoginDiv = document.getElementById('doctor-info-last-login');
    var lastLogin = doctor.lastLogin + ' ' + doctor.lastLoginTime + ' +0000';
    var lastLoginMoment = moment(lastLogin, 'YYYY-MM-DD hh:mm:ss Z');
    lastLoginDiv.innerHTML = 'Last Login: ' + lastLoginMoment.format('lll');

    patients = [];
    viewing = doctor;
    var area = document.getElementById('doctor-info-patient-area');
    var table = document.createElement('table');
    table.id = 'doctor-info-patient-table';
    area.innerHTML = '';
    area.appendChild(table);

    var inner = '<thead><tr><th>ID</th><th>Family Name</th><th>Given Name</th><th>Email</th><th></th><th></th></tr></thead><tbody>';

    poster.post(postobj, '/fetch/patientMeta', function (resObj) {
        for (var i = 0; i < resObj.meta.length; i++)
        {
            var pat = resObj.meta[i];
            var patient = {
                id: pat.id,
                familyName: pat.familyName,
                givenName: pat.givenName,
                email: pat.email
            };
            if (pat.doctorEmail != viewing.email)
                continue;
            patients.push(pat);
            inner += '<tr><td>' + pat.id
                   + '</td><td>' + pat.familyName
                   + '</td><td>' + pat.givenName
                   + '</td><td>' + pat.email
                   + '</td><td><button class="doctor-info-patient-transfer-btn" data-pat=' + JSON.stringify(patient) + '>Transfer</button>'
                   + '</td><td><button class="doctor-info-patient-retire-btn" data-pat=' + JSON.stringify(patient) + '>Retire</button>'
                   + '</td></tr>';
        }

        inner += '</tbody>';

        table = document.getElementById('doctor-info-patient-table');
        table.innerHTML = inner;

        var btns = document.getElementsByClassName('doctor-info-patient-transfer-btn');
        for (var i = 0; i < btns.length; i++)
            btns[i].addEventListener('click', TransferPrompt);
        
        btns = document.getElementsByClassName('doctor-info-patient-retire-btn');
        for (var i = 0; i < btns.length; i++)
            btns[i].addEventListener('click', RetirePatientPrompt);
        
        var insertBtn = document.createElement('button');
        insertBtn.id = 'doctor-info-patient-insert-btn';
        insertBtn.innerHTML = 'INSERT';
        area.appendChild(insertBtn);

        document.getElementById('doctor-info-patient-insert-btn').addEventListener('click', InsertPatientPrompt);

        $('#doctor-info-patient-table').dataTable();
    });
}

function RemoveDoctorPrompt ()
{
    if (viewing == null)
        return;
    if (viewing.email == settings.get('email'))
    {
        console.log('Cannot Remove Yourself');
        return;
    }
    if (patients.length != 0)
    {
        console.log('Please Transfer All Patients Before Removing');
        return;
    }
    
    var win = new BrowserWindow({
        width: 600,
        height: 400,
        title: 'Remove Doctor'
    });
    win.loadURL(url.format({
        pathname: path.join(__dirname, '/../view/popups/removeDoctor.html'),
        protocol: 'file:',
        slashes: true
    }));
    win.show();
    win.on('close', () => { win = null; });
}

function TransferPrompt (event)
{
    if (viewing == null)
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
    if (viewing == null)
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
    if (viewing == null)
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
    if (arg == 'get')
        event.returnValue = viewing;
    else if (arg == 'change')
    {
        ReturnToListBtn();
        viewing = null;
        event.returnValue = null;
    }
    else
    {
        viewing = null;
        event.returnValue = null;
    }
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