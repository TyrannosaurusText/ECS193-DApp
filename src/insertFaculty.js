const electron = require('electron');
const settings = require('electron-settings');
const poster = require('./utils/poster');
const loginHandler = require('./login.js');

const insertBtn = document.getElementById('insert-faculty');
const form = document.getElementById('insert-faculty-form');

insertBtn.addEventListener('click', function (event)
{
    event.preventDefault();
    var fName = form[0].value;
    var fEmail = form[1].value;
    var fAccType = form[2].value;

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
        newAccType: fAccType,
        authCode: settings.get('authCode')
    };

    poster.post(postObj, '/account/sendEmail', emailCB);

    function emailCB (resObj)
    {
        var resDiv = document.getElementById('insert-faculty-response');
        resDiv.innerHTML = JSON.stringify(resObj);
    }
});