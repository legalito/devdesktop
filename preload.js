const {contextBridge, ipcRenderer, ipcMain} = require('electron');

contextBridge.exposeInMainWorld("api", {
  initiaisize : () => {

  },
  setupFileListHandler : (callback) => {
    ipcRenderer.on("file-list", (event, files) => {
      callback(files);
    });
  },
  getFileContent : (folder, file, callback) => {
    ipcRenderer.send("get-file-content", {folder, file});
    ipcRenderer.on("file-content", (event, data) => {
      callback(data);
    });
  },
  updateFileContent : (folder, file, content) => {
    ipcRenderer.send("update-file-content", {folder, file, content});
  }
});