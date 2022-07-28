const {
    app,
    BrowserWindow
} = require("electron")
const path = require("path")
const funcs = require("./js/funcs.js")

const createWindow = function () {
    const MainWindow = new BrowserWindow({
        width: 1000,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            // 官网似乎说是默认false，但是这里必须设置contextIsolation
            contextIsolation: false
            // preload : path.join(__dirname, "js/search.js")
        }
    });
    MainWindow.loadFile("html\\index.html");
}


app.whenReady().then(()=>{
    createWindow();
})