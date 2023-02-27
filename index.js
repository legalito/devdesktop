const {BrowserWindow, app, Menu} = require('electron');
const {join} = require('path');
const {readdir, readFile} = require('fs/promises');
const {homedir} = require('os');

const createWindow = () => {
  const win = new BrowserWindow({
    minWidth: 800,
    minHeight: 300,
    show : false,
    webPreferences: {
      preload : join(__dirname, 'preload.js')
    }
  });

  win.once('ready-to-show', async () => {
    win.show();
    let files = await readdir(homedir());
    files = files.filter(file => file.endsWith(".txt") || file.endsWith(".md"));
    win.webContents.send("file-list", files);
  });

  win.webContents.ipc.on("get-file-content", async (e, data) => {
    const content = await readFile(join(homedir(), data.file), "utf-8");
    win.webContents.send("file-content", content);
  });

  win.webContents.ipc.on("update-file-content", async (e, data) => {
    
  });
  
  win.loadFile('index.html');
  return win
};

const mainMenu = Menu.buildFromTemplate([{
  label: 'File',
  submenu: [{
    label: 'Open Folder ...',
    accelerator: 'CmdOrCtrl+O',
  },
  {
    label: 'Save',
    accelerator: 'CmdOrCtrl+S',
  },
  ...(process.env.NODE_ENV == "production" ? [] : [{role : "toggledevtools"}, {role : "reload"}])
  ]
}]);

Menu.setApplicationMenu(mainMenu);

const initialize = async () => {
  await app.whenReady();
  createWindow();
};

initialize();

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  createWindow();
});
