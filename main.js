const {
    app,
    BrowserWindow,
    ipcMain,
    dialog
} = require("electron")

require("./api/server").serveNcmApi({
    checkVersion: true,
})

var MainWindow;

const createWindow = function () {
    MainWindow = new BrowserWindow({
        width: 1000,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            // 官网似乎说是默认false，但是这里必须设置contextIsolation
            contextIsolation: false,
            webSecurity: false,
            nodeIntegrationInWorker: true,
            // preload : path.join(__dirname, "js/funcs.js")
        }
    });
    MainWindow.loadFile("html\\index.html");
}

app.whenReady().then(() => {
    createWindow();
})

ipcMain.on("open-dialog", (event, arg) => {
    dialog.showOpenDialog({ properties: ['openDirectory'] })
        .then(function (response) {
            if (!response.canceled) {
                // handle fully qualified file name
                event.reply("path-reply",response.filePaths[0])
            }});})