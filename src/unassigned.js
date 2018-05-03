const settings = require('electron-settings');
const poster = require('./utils/poster.js');
const remote = require('electron').remote;
const BrowserWindow = remote.BrowserWindow;
const ipcMain = remote.ipcMain;
const url = require('url');
const path = require('path');

var sectionBtn = null;
var postobj = { 
    authCode: settings.get('authCode') 
};
var patients = [];
var curPatient = '';

function Bind ()
{
    sectionBtn = document.getElementById('button-unassigned');
    sectionBtn.addEventListener('click', GatherPatients);
}

function GatherPatients ()
{
    patients = [];

    var area = document.getElementById('unassigned-table-area');
    var table = document.createElement('table');
    table.id = 'unassigned-patient-table';
    area.innerHTML = '';
    area.appendChild(table);

    var inner = '<tr><th>ID</th><th>Family Name</th><th>Given Name</th><th>Email</th><th></th><th></th></tr>';

    poster.post(postobj, '/fetch/patientMeta', function (resObj) {
        for (var i = 0; i < resObj.meta.length; i++)
        {
            if (resObj.meta[i].doctorEmail == '')
            {
                var pat = resObj.meta[i];
                patients.push(pat);
                inner += '<tr><td>' + pat.id
                       + '</td><td>' + pat.familyName
                       + '</td><td>' + pat.givenName
                       + '</td><td>' + pat.email
                       + '</td><td><button class="unassigned-patient-assign-btn" data-pat=' + JSON.stringify(pat) + '>Assign</button>'
                       + '</td><td><button class="unassigned-patient-remove-btn" data-pat=' + JSON.stringify(pat) + '>Remove</button>'
                       + '</td></tr>';
            }
        }

        table = document.getElementById('unassigned-patient-table');
        table.innerHTML = inner;

        var btns = document.getElementsByClassName('unassigned-patient-assign-btn');
        for (var i = 0; i < btns.length; i++)
            btns[i].addEventListener('click', AssignPrompt);
        
        btns = document.getElementsByClassName('unassigned-patient-remove-btn');
        for (var i = 0; i < btns.length; i++)
            btns[i].addEventListener('click', RemovePrompt);
    });
}

function AssignPrompt (event)
{
    curPatient = JSON.parse(event.srcElement.dataset.pat);

    var win = new BrowserWindow({
        width: 600,
        height: 400,
        title: 'Assign Patient'
    });
    win.loadURL(url.format({
        pathname: path.join(__dirname, '/../view/popups/assignPatient.html'),
        protocol: 'file:',
        slashes: true
    }));
    win.show();
    win.on('close', () => { win = null; });
}

function RemovePrompt (event)
{
    curPatient = JSON.parse(event.srcElement.dataset.pat);

    var win = new BrowserWindow({
        width: 600,
        height: 400,
        title: 'Remove Patient'
    });
    win.loadURL(url.format({
        pathname: path.join(__dirname, '/../view/popups/removePatient.html'),
        protocol: 'file:',
        slashes: true
    }));
    win.show();
    win.on('close', () => { win = null; });
}

ipcMain.on('ipc-unassigned-curPatient', (event, arg) => {
    if (arg == 'get')
        event.returnValue = curPatient;
    else if (arg == 'change')
    {
        GatherPatients();
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