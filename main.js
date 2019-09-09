const electron = require('electron');
const settings = require('electron-settings');
const path = require('path');
const url = require('url');

const { app, BrowserWindow, Menu } = electron;

app.setName('NIBVA');

var win = null;

app.on('ready', () => {
    settings.set('clientID', '671445578517-io87npos82nmk6bk24ttgikc9h4uls4l.apps.googleusercontent.com');
    settings.set('signedIn', false);
    settings.set('authCode', '');
    settings.set('email', '');
    settings.set('accType', '');
    settings.set('name', '');

    win = new BrowserWindow({
        width: 1280,
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

    win.on('close', (event) => {
        win.webContents.send('close', 'signout');
    });

    win.on('closed', () => {
        app.quit();
    });
});

app.on('window-all-closed', () => {
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