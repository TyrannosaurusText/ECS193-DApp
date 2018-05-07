const poster = require('./utils/poster.js');
const loginHandler = require('./utils/loginHandler.js');
const settings = require('electron-settings');
const ipc = require('electron').ipcRenderer;
const remote = require('electron').remote;
const BrowserWindow = remote.BrowserWindow;
const ipcMain = remote.ipcMain;
const url = require('url');
const path = require('path');
const csvParse = require('csv-parse');
const chartjs = require('chart.js');
const moment = require('moment');
const globals = require('../assets/globals.js');

var sectionBtn = null;
var viewing = null;

ipc.on('close', (event, message) => {
    if (settings.get('signedIn'))
        loginHandler.signOut();
});

function bindButtons ()
{
    sectionBtn = document.getElementById('button-landing');
    sectionBtn.addEventListener('click', CreateInterface);

    if (settings.get('email') == '')
    {
        document.getElementById('button-oauth-signin').innerHTML = 'Sign In with Google';
        document.getElementById('button-oauth-signin').addEventListener('click', loginHandler.signIn);
    }
    else
    {
        document.getElementById('button-oauth-signin').innerHTML = 'Sign Out';
        document.getElementById('button-oauth-signin').addEventListener('click', loginHandler.signOut);

        document.getElementById('graph-patient-back-btn').addEventListener('click', ReturnToListBtn);
    }

    CreateInterface();
}

function CreateInterface ()
{
    if (viewing != null)
        ReturnToList('CreateInterface');

    if (settings.get('accType') == 'doctor' || settings.get('accType') == 'adminDoctor')
    {
        var postobj = { 
            authCode: settings.get('authCode') 
        };

        var area = document.getElementById('landing-patient-area');
        var tableHeader = document.createElement('h3');
        tableHeader.innerHTML = 'Patients';
        var table = document.createElement('table');
        table.id = 'landing-patient-table';
        area.innerHTML = '';
        area.appendChild(tableHeader);
        area.appendChild(table);
    
        var inner = '<tr><th>ID</th><th>Family Name</th><th>Given Name</th><th>Email</th><th></th></tr>';
    
        poster.post(postobj, '/fetch/patientMeta', function (resObj) {
            for (var i = 0; i < resObj.meta.length; i++)
            {
                var pat = resObj.meta[i];
                //console.log(pat);
                var date = pat.lastLogin;
                pat.lastLogin = date.substring(0, 10);
                pat.lastLoginTime = date.substring(11, 19);
                if (pat.doctorEmail != settings.get('email'))
                    continue;
                inner += '<tr><td>' + pat.id
                       + '</td><td>' + pat.familyName
                       + '</td><td>' + pat.givenName
                       + '</td><td>' + pat.email
                       + '</td><td><button class="graph-patient-details-btn" data-pat=' + JSON.stringify(pat) + '>Details</button>'
                       + '</td></tr>';
            }
    
            table = document.getElementById('landing-patient-table');
            table.innerHTML = inner;

            var btns = document.getElementsByClassName('graph-patient-details-btn');
            for (var i = 0; i < btns.length; i++)
            {
                btns[i].addEventListener('click', (event) => {
                    //console.log(event.srcElement.dataset.pat);
                    var pat = JSON.parse(event.srcElement.dataset.pat);
                    document.getElementById('landing-list-view').classList.remove('is-shown');
                    SetupDetailedView(pat);
                    document.getElementById('landing-patient-view').classList.add('is-shown');
                });
            }
        });
    }
}

function ReturnToListBtn () { ReturnToList('Button'); }
function ReturnToList (source)
{
    viewing = null;
    if (source != 'CreateInterface')
        CreateInterface();
    document.getElementById('landing-patient-view').classList.remove('is-shown');
    document.getElementById('landing-list-view').classList.add('is-shown');
}

function SetupDetailedView (patient)
{
    viewing = patient;

    var postobj = {
        authCode: settings.get('authCode'),
        id: patient.id
    };

    poster.post(postobj, '/fetch/events', function(resObj) {
        var csv = csvParse(resObj.csv, {comment: '#'}, function(err,output){
            constructEventTable(output, patient);
        });
    });
    CompileNotes(patient);
    poster.post(postobj, '/fetch/readings', function (resObj) {
        var csv = csvParse(resObj.csv, { comment: '#' }, function (err, output) {
            ChartCSV(output, patient);
            ShowTable(output, patient);
        });
    });
}

function ChartCSV (output, patient)
{
    var area = document.getElementById('graph-patient-chart-area');
    area.innerHTML = '';

    var canvas = document.createElement('canvas');
    canvas.id = 'graph-patient-chart';
    canvas.width = '100%';
    canvas.height = 400;
    area.appendChild(canvas);

    var config = {
        type: 'line',
        data: {
            datasets: []
        },
        options: {
            maintainAspectRatio: false,
            responsive: true,
            elements: {
                line: {
                    tension: 0.1
                }
            },
            title: {
                display: true,
                text: patient.familyName + ', ' + patient.givenName
            },
            tooltips: {
                mode: 'index',
                intersect: false,
            },
            hover: {
                mode: 'nearest',
                intersect: true
            },
            scales: {
                xAxes: [{
                    type: 'time',
                    display: true,
                    ticks: {
                        major: {
                            fontStyle: 'normal',
                            fontColor: '#FFFFFF'
                        }
                    },
                    time: {
                        displayFormats: {
                            millisecond: 'lll',
                            second: 'lll',
                            minute: 'lll',
                            hour: 'lll',
                            day: 'lll',
                            week: 'lll',
                            month: 'lll',
                            quarter: 'lll',
                            year: 'lll'
                        }
                    }
                }],
                yAxes: [{
                    display: true,
                    scaleLabel: {
                        display: true,
                        labelString: 'Value'
                    }
                }]
            }
        }
    };
    for (var i = 0; i < globals.channelAmt; i++)
    {
        var datasetObj = {
            label: 'Channel ' + i.toString(),
            backgroundColor: globals.channelColors[i],
            borderColor: globals.channelColors[i],
            data: [],
            fill: false,
            hidden: true
        };
        config.data.datasets.push(datasetObj);
    }
    for (var i = 0; i < output.length; i++)
    {
        for (var j = 1; j < output[i].length; j++)
        {
            var ch = j - 1;
            var dateStr = output[i][0].toString();
            dateStr = dateStr.substring(0, dateStr.length - 6); //remove postfix ' (UTC)'
            //console.log(dateStr);
            config.data.datasets[ch].data.push({
                x: moment(dateStr, 'ddd MMM DD YYYY hh:mm:ss Z'),
                y: parseFloat(output[i][j])
            });
        }
    }

    var ctx = document.getElementById('graph-patient-chart').getContext('2d');
    var patientChart = new Chart(ctx, config);
}

function ShowTable (output, patient)
{
    var area = document.getElementById('graph-patient-table-area');
    area.innerHTML = '';
    var table = document.createElement('table');
    table.id = 'graph-patient-table';
    area.appendChild(table);

    var inner = '';
    inner += '<tr><th>Timestamp</th>';
    for (var i = 0; i < globals.channelAmt; i++)
        inner += '<th>CH' + i.toString() + '</th>';
    inner += '</tr>';

    for (var i = 0; i < output.length; i++)
    {
        inner += '<tr><td>';

        var dateStr = output[i][0].toString();
        dateStr = dateStr.substring(0, dateStr.length - 6);
        var mmt = moment(dateStr, 'ddd MMM DD YYYY hh:mm:ss Z');
        inner += mmt.format('lll');

        inner += '</td>'
        for (var j = 1; j < output[i].length; j++)
            inner += '<td>' + parseFloat(output[i][j]).toFixed(2).toString() + '</td>'
        inner += '</tr>';
    }

    table = document.getElementById('graph-patient-table');
    table.innerHTML = inner;
}

function constructEventTable(csv, patient)
{
    var voids = 0;
    var avgVoidAmt = 0;
    var avgVoidTime = 0;
    var tempTime = null;
    var area = document.getElementById('graph-patient-event');
    area.innerHTML = '';
    var table = document.createElement('table');
    table.id = 'graph-patient-event-table';
    area.appendChild(table);

    var inner = '<tr>';
    inner += '<th>' + "Event Type" + '</th>';
    inner += '<th>' + "Timestamp" + '</th>';
    inner += '<th>' + "Amount" + '</th>';
    
    inner += '</tr>';

    for (var i = 0; i < csv.length; i++)
    {
        inner += '<tr>';

        var dateStr = csv[i][0].toString();
        dateStr = dateStr.substring(0, dateStr.length - 6);
        
        var EventType = csv[i][1];
        var VoidAmount = parseFloat(csv[i][2]);

        inner += '<td>' + EventType + '</td>';
        
        inner+= '<td>';
        var mmt = moment(dateStr, 'ddd MMM DD YYYY hh:mm:ss Z');
        inner += mmt.format('lll');
        inner += '</td>'
        
        if(EventType == 'leak')
            inner += '<td>'  + '</td>'
        else if (EventType == 'void')
        {
            inner += '<td>' + VoidAmount + '</td>';
            voids++;
            avgVoidAmt += VoidAmount;

            if (tempTime == null)
                tempTime = mmt;
            else
            {
                var dur = moment.duration(mmt.diff(tempTime));
                tempTime = mmt;
                //console.log(dur);
                avgVoidTime += dur.asMilliseconds();
            }
        }
        
        inner += '</tr>';
    }

    table = document.getElementById('graph-patient-event-table');
    table.innerHTML = inner;

    avgVoidAmt /= voids;
    tempTime = moment.duration(avgVoidTime);

    var avgs = document.getElementById('patient-event-avg');
    avgs.innerHTML = 'Last Login: ' + patient.lastLogin + ' ' + patient.lastLoginTime + ' UTC';
    avgs.innerHTML += '<br>Average Time Between Voids: ' + tempTime.humanize(false);
    avgs.innerHTML += '<br>Average Void Amount: ' + avgVoidAmt + 'ml';
}

function CompileNotes (patient)
{
    var noteobj = {
        authCode: settings.get('authCode'),
        id: settings.get('id')
    };
    poster.post(noteobj, '/fetch/notes', function (resObj) {
        //console.log(resObj);
        //console.log(patient);

        var area = document.getElementById('patient-notes-area');
        area.innerHTML = '<h3>Notes</h3>';
        var table = document.createElement('table');
        table.id = 'patient-notes-table';
        area.appendChild(table);

        var inner = '<tr><th>Date</th><th>Note</th></tr>';
        Array.prototype.forEach.call(resObj, function (n) {
            if (n.patientID == patient.id)
                inner += '<tr><td>' + n.timestamp.substring(0,10) + '</td><td>' + n.note + '</td></tr>';
        });

        inner += '<tr><td><button id="patient-note-insert-btn">Insert Note</button></td>';
        inner += '<td><input id="patient-note-new" type="text"/></td></tr>'

        table = document.getElementById('patient-notes-table');
        table.innerHTML = inner;

        document.getElementById('patient-note-insert-btn').addEventListener('click', InsertNote);
    });
}

function InsertNote ()
{
    var postobj = {
        authCode: settings.get('authCode'),
        id: settings.get('id'),
        patientID: viewing.id,
        note: document.getElementById('patient-note-new').value
    };
    poster.post(postobj, '/insert/note', cb);

    function cb () {
        CompileNotes(viewing);
    }
}

module.exports.bindButtons = bindButtons;