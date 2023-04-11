const { BrowserWindow, app, Menu, dialog } = require('electron');
const { join } = require('path');
const { readdir, readFile } = require('fs/promises');
const { homedir } = require('os');
const archiver = require('archiver');
const fs = require('fs');
let mainWindow;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    minWidth: 800,
    minHeight: 300,
    show: false,
    webPreferences: {
      preload: join(__dirname, 'preload.js')
    }
  });

  mainWindow.once('ready-to-show', async () => {
    mainWindow.show();
    let files = await readdir(homedir());
    files = files.filter(file => file.endsWith(".txt") || file.endsWith(".codeprez"));
    mainWindow.webContents.send("file-list", files);
  });

  mainWindow.webContents.ipc.on("get-file-content", async (e, data) => {
    const content = await readFile(join(homedir(), data.file), "utf-8");
    mainWindow.webContents.send("file-content", content);
  });

  mainWindow.webContents.ipc.on("update-file-content", async (e, data) => {

  });

  mainWindow.loadFile('index.html');
  return mainWindow;
};

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

const openFolder = async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  if (!result.canceled) {
    let files = await readdir(result.filePaths[0]);
    files = files.filter(file => file.endsWith(".codeprez"));
    mainWindow.webContents.send("file-list", files);
  }
}

async function createZipArchive(filePath) {
  try {
    const archive = archiver('zip', { zlib: { level: 9 }});
    const outputFilePath = `${filePath}.zip`;
    const output = fs.createWriteStream(outputFilePath);
    output.on('close', () => {
      console.log(`${outputFilePath} created successfully.`);
    });
    archive.on('error', (err) => {
      throw err;
    });
    archive.pipe(output);
    archive.directory(filePath, false);
    archive.finalize();
  } catch (err) {
    console.error(err);
  }
}

const template = [
  {
    label: 'File',
    submenu: [
      {
        label: 'Open File...',
        accelerator: 'CmdOrCtrl+O',
        click: async () => {
          const result = await dialog.showOpenDialog(mainWindow, {
            properties: ['openFile'],
            filters: [
              { name: 'CodePrez Files', extensions: ['codeprez'] },
            ]
          });
          if (!result.canceled) {
            console.log(result.filePaths[0]);
            const filePath = result.filePaths[0];
            await createZipArchive(filePath);          }
        }
      },
      {
        label: 'Open Folder...',
        accelerator: 'CmdOrCtrl+Shift+O',
        click: openFolder
      },
      {
        label: 'Open DevTools',
        accelerator: 'CmdOrCtrl+Shift+I',
        click: () => {
          mainWindow.webContents.openDevTools();
        }
      },
      { role: 'quit' }
    ]
  }
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);
