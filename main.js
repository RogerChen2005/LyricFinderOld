const {
    app,
    BrowserWindow
} = require("electron")

const createWindow = function () {
    const win = new BrowserWindow({
        width: 1000,
        height: 800
    });
    win.loadFile("html\\index.html");
}


app.whenReady().then(()=>{
    createWindow();
})