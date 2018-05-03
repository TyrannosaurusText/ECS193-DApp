const electron = require('electron');
const settings = require('electron-settings');
const poster = require('./utils/poster');

const insertBtn = document.getElementById('insert-faculty');
const form = document.getElementById('insert-faculty-form');

insertBtn.addEventListener('click', function (event)
{
    event.preventDefault();
    var fName = form[0].value;
    var gName = form[1].value;
    var fEmail = form[2].value;
    var fAccType = form[3].value;

    if (fName == '' || gName == '')
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
        recipientFamilyName: fName,
        recipientGivenName: gName,
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