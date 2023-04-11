const {contextBridge,ipcRenderer} = require("electron");

contextBridge.exposeInMainWorld("api",{
    setupFileListHandler(callback){
        ipcRenderer.on("file-list",(e,data) => {
            callback(data.folder,data.files);
        })
    },
    getFileContent : (folder,file,callback) => {
        ipcRenderer.send("get-file-content",{folder,file});
        ipcRenderer.once("file-content",(e,data) => {
            callback(data);
        });
    },
    updateFileContent : (folder,file,content) => {
        ipcRenderer.send("update-file-content",{folder,file,content});
    },
    setupReadyToSave : (callback) => {
        ipcRenderer.once("ready-to-save",(e,data) => {
            callback(data.folder,data.file);
        })
    }
});

