const {BrowserWindow, app,Menu, dialog} = require('electron');
const {join, basename, dirname} = require("path");
const {readdir, readFile, writeFile} = require("fs/promises");
const {homedir} = require("os");

const windows = [];

const createWindow = (folder) => {
    const win = new BrowserWindow({
        minWidth : 800,
        minHeight : 300,
        show : false,
        webPreferences : {
            preload : join(__dirname,"preload.js")
        }
    });
    windows.push({
        window : win,
        folder : folder,
    });
    win.once("ready-to-show",async () => {
        win.show();
        await setCurrentFolder(folder,win);
    });
    win.once("close", () => {
        windows.splice(windows.findIndex((element) => element.window == win),1);
    });

    win.webContents.ipc.on("get-file-content",async (e,data) => {
        const content = await readFile(join(data.folder,data.file),{encoding : "utf-8"});
        win.webContents.send("file-content",content);
    });

    win.webContents.ipc.on("update-file-content", async (e,data) => {
        await writeFile(join(data.folder,data.file),data.content,{encoding : "utf-8"});
    });

    win.loadFile("front/index.html");
    return win;
};

const setCurrentFolder = async (folder, win) => {
    let files = await readdir(folder);
    files = files.filter((file) => file.endsWith(".codeprez"));
    win.webContents.send("file-list",{folder : folder,files});
    windows.find((elem) => elem.window == win).folder = folder;
};

const saveAs = async () => {
    const currentFolder = windows.find(
        (elem) => elem.window == BrowserWindow.getFocusedWindow()
    ).folder;
    const saveDialogResult = await dialog.showSaveDialog(BrowserWindow.getFocusedWindow(),{
        title : "Save as...",
        defaultPath : currentFolder,
        buttonLabel : "Save",
        filters : [
            {
                name : "Diaporama",
                extensions : ["codeprez"],
            }
        ]
    });
    if(!saveDialogResult.canceled){
        const file = basename(saveDialogResult.filePath);
        const folder = dirname(saveDialogResult.filePath);
        await setCurrentFolder(folder,BrowserWindow.getFocusedWindow());
        BrowserWindow.getFocusedWindow().webContents.send("ready-to-save",{file,folder});
    }
}

const openFolder = async () => {
    const openDialogResult = await dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
        title : "Open folder ...",
        buttonLabel : "Open",
        properties : [
            "createDirectory",
            "openDirectory",
            "promptToCreate",
        ],
        filters : [
          {
              name : "Diaporama",
              extensions : ["codeprez"],
          }
      ]
    });
    if(!openDialogResult.canceled){
        setCurrentFolder(openDialogResult.filePaths[0],BrowserWindow.getFocusedWindow());
    }
};

const mainMenu = Menu.buildFromTemplate([{
    label : "File",
    submenu : [
        {
            label : "Open Folder ...",
            accelerator : "Ctrl+O",
            click : openFolder,
        },
        {
            label : "Open Folder In new Window...",
            accelerator : "Ctrl+Shift+O",
        },
        {
            label : "Save as...",
            accelerator : "Ctrl+S",
            click : saveAs,
        },
        ...(process.env.NODE_ENV == "production" ? [] : [{role : "toggleDevTools"},{role : "reload"}])
    ]

}]);


Menu.setApplicationMenu(mainMenu);

const initialize = async () => {
    await app.whenReady();
    createWindow(homedir());
};

initialize();

app.on("window-all-closed", () => {
    if(process.platform != "darwin"){
        app.quit();
    }
});

app.on("activate",() => {
    if(BrowserWindow.getAllWindows().length == 0){
        createWindow(homedir());
    }
});