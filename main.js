const electron = require('electron');
const settings = require('electron-settings');
const path = require('path');
const url = require('url');

const { app, BrowserWindow, Menu } = electron;

app.setName('Electron Test');

var win = null;

app.on('ready', function ()
{
    settings.set('clientID', '671445578517-io87npos82nmk6bk24ttgikc9h4uls4l.apps.googleusercontent.com');
    settings.set('accessToken', '');
    settings.set('refreshToken', '');
    settings.set('email', '');
    settings.set('accType', '');
    settings.set('name', '');

    win = new BrowserWindow({
        width: 1080,
        height: 720,
        minWidth: 720,
        minHeight: 600, 
        title: app.getName()
    });
    win.loadURL(url.format({
        pathname: path.join(__dirname, '/index.html'),
        protocol: 'file:',
        slashes: true
    }));
    win.show();

    var menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    win.on('closed', function()
    {
        settings.set('accessToken', '');
        settings.set('refreshToken', '');
        settings.set('email', 'NULL');
        settings.set('accType', '');
        settings.set('name', '');
        app.quit();
    });
});

app.on('window-all-closed', function ()
{
    app.quit();
});

var template = [{}];

if (process.platform == 'darwin')
    template.unshift({});

if (process.env.NODE_ENV != 'production')
{
    template.push({
        label: 'Developer Tools',
        submenu: [{
            label: 'Toggle DevTools',
            accelerator: 'CmdOrCtrl+I',
            click(item, focusedWindow){
                focusedWindow.toggleDevTools();
            }
        }]
    });
}