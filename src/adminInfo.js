const settings = require('electron-settings');
const poster = require('./utils/poster.js');
const remote = require('electron').remote;
const BrowserWindow = remote.BrowserWindow;
const ipcMain = remote.ipcMain;
const url = require('url');
const path = require('path');

var postobj = null;
var sectionBtn = null;
var viewing = null;

function Bind ()
{
    window.$ = window.jQuery = require('jquery');

    //console.log('BindDoctorInfo');
    sectionBtn = document.getElementById('button-admin-info');
    sectionBtn.addEventListener('click', GatherAdmins);

    postobj = { authCode: settings.get('authCode') };
}

function GatherAdmins ()
{
    poster.post(postobj, '/fetch/admins', function (resObj) {
        var area = document.getElementById('admin-info-table-area');
        area.innerHTML = '';
        var table = document.createElement('table');
        table.id = 'admin-info-table';
        area.innerHTML = '';
        area.appendChild(table);

        var inner = '<thead><tr><th>Family Name</th><th>Given Name</th><th>Email</th><th></th><th></th></tr></thead><tbody>';

        for (var i = 0; i < resObj.length; i++)
        {
            var a = resObj[i];
            inner += '<tr><td>' + a.familyName
                   + '</td><td>' + a.givenName
                   + '</td><td>' + a.email
                   + '</td><td><button class="admin-info-remove-btn" data-admin=' + JSON.stringify(a) + '>Remove</button>';

            if (a.accType == 'admin')
                inner += '</td><td><button class="admin-info-make-doctor-btn" data-admin=' + JSON.stringify(a) + '>Make Doctor</button>';
            else
                inner += '</td><td>';

            inner += '</td></tr>';
        }
        inner += '</tbody>';

        table = document.getElementById('admin-info-table');
        table.innerHTML = inner;

        var btns = document.getElementsByClassName('admin-info-remove-btn');
        for (var i = 0; i < btns.length; i++)
            btns[i].addEventListener('click', RemovePrompt);

        btns = document.getElementsByClassName('admin-info-make-doctor-btn');
        for (var i = 0; i < btns.length; i++)
            btns[i].addEventListener('click', MakeDoctor);

        $('#admin-info-table').dataTable();
    });
}

function MakeDoctor ()
{
    viewing = JSON.parse(event.srcElement.dataset.admin);

    if (viewing.email == settings.get('email'))
    {
        console.log('Cannot Modify Yourself');
        return;
    }

    var makeDoctorObj = {
        authCode: settings.get('authCode'),
        email: viewing.email,
        accType: 'adminDoctor'
    };
    poster.post(makeDoctorObj, '/modify/faculty', modifyCB);

    function modifyCB (resObj)
    {
        if (resObj.hasOwnProperty('body'))
            GatherAdmins();
    }
}

function RemovePrompt ()
{
    viewing = JSON.parse(event.srcElement.dataset.admin);

    if (viewing.email == settings.get('email'))
    {
        console.log('Cannot Remove Yourself');
        return;
    }
    
    var win = new BrowserWindow({
        width: 600,
        height: 400,
        title: 'Remove Admin'
    });
    win.loadURL(url.format({
        pathname: path.join(__dirname, '/../view/popups/removeAdmin.html'),
        protocol: 'file:',
        slashes: true
    }));
    win.show();
    win.on('close', () => { win = null; });
}

ipcMain.on('ipc-admin-info-curAdmin', (event, arg) => {
    if (arg == 'get')
        event.returnValue = viewing;
    else if (arg == 'change')
    {
        GatherAdmins();
        viewing = null;
        event.returnValue = null;
    }
    else
    {
        viewing = null;
        event.returnValue = null;
    }
});

module.exports.Bind = Bind;