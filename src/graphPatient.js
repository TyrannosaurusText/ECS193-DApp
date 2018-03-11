var csvParse = require('csv-parse');
var poster = require('./utils/poster');
var chartjs = require('chart.js');
var moment = require('moment');
var globals = require('../assets/globals.js');

var doctorSelect = document.getElementById('graph-patient-doctor-select');
var patientList = document.getElementById('graph-patient-patient-id');
var sectionBtn = document.getElementById('button-graph-patient');
var graphBtn = document.getElementById('graph-patient-display-chart');

sectionBtn.addEventListener('click', GatherDoctorList);
function GatherDoctorList ()
{
    var postobj = {};
    poster.post(postobj, '/fetch/doctors', function (res) {
        res.setEncoding('utf8');
        res.on('data', function (body) {
            doctorSelect.innerHTML = '';
            patientList.innerHTML = '';

            var opt = document.createElement('option');
            opt.value = 'NULL';
            opt.innerHTML = '--Select--';
            doctorSelect.appendChild(opt);

            var dlist = JSON.parse(body);
            Array.prototype.forEach.call(dlist, function (d) {
                opt = document.createElement('option');
                opt.value = d;
                opt.innerHTML = d;
                doctorSelect.appendChild(opt);
            });
        });
    });
}

function GatherPatientList ()
{
    var postobj = { doctor: doctorSelect.value };

    if (doctorSelect.value == '' || doctorSelect.value == 'NULL')
        return;

    poster.post(postobj, '/fetch/doctorList', function (res) {
        res.setEncoding('utf8');
        res.on('data', function (body) {
            patientList.innerHTML = '';
            var plist = JSON.parse(body);
            Array.prototype.forEach.call(plist, function (p) {
                var opt = document.createElement('option');
                opt.value = p;
                opt.innerHTML = p;
                patientList.appendChild(opt);
            });
        });
    });
}

graphBtn.addEventListener('click', GraphPatientData);
function GraphPatientData (event)
{
    event.preventDefault();
    if (doctorSelect.value == '' || doctorSelect.value == 'NULL' || patientList.value == '')
        return;

    var postobj = { id: patientList.value };
    poster.post(postobj, '/fetch/readings', function (res) {
        res.setEncoding('utf8');
        res.on('data', function (body) {

            var area = document.getElementById('graph-patient-chart-area');
            area.innerHTML = '';

            var csv = csvParse(body, { comment: '#' }, function (err, output) {
                ChartCSV(output);
                ShowTable(output);
            });
        });
    });
}

function ChartCSV (output)
{
    var area = document.getElementById('graph-patient-chart-area');
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
            title:{
                display: true,
                text: doctorSelect.value + ': Patient ' + patientList.value
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
            fill: false
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
            console.log(dateStr);
            config.data.datasets[ch].data.push({
                x: moment(dateStr, 'ddd MMM DD YYYY hh:mm:ss Z'),
                y: parseFloat(output[i][j])
            });
        }
    }
    console.log(config);
    var ctx = document.getElementById('graph-patient-chart').getContext('2d');
    var patientChart = new Chart(ctx, config);
}

function ShowTable (output)
{
    var area = document.getElementById('graph-patient-chart-area');
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

module.exports.GatherPatientList = GatherPatientList;
module.exports.GraphPatientData = GraphPatientData;