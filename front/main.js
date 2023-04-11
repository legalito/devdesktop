const INPUT_SAVE_DELAY = 0.7;

const textarea = document.querySelector("textarea");
const fileTitle = document.querySelector("#currentFileName");
const ul = document.querySelector("#fileList");

let currentFile = "";
let currentFolder = "";
let contentBeforeReinitialization = "";

const reinitializeView = () => {
    currentFile = "";
    fileTitle.textContent = "No presentation";
    textarea.value = "";
};

const setupLi = (fileName,untitled) => {
    const li = document.createElement("li");
    li.textContent = fileName;
    li.addEventListener("click", untitled ? reinitializeView : () => {
        fileTitle.textContent = fileName;
        currentFile = fileName;
        window.api.getFileContent(currentFolder,fileName, (content) => {
            textarea.value = content;
        });
    });
    return li;
};

window.api.setupFileListHandler((folder,files) => {
    currentFolder = folder;
    ul.innerHTML = "";
    contentBeforeReinitialization = textarea.value;
    reinitializeView();
    for(const file of files){
        ul.appendChild(setupLi(file,false));
    }
    ul.appendChild(setupLi(" + New File...",true));
});

window.api.setupReadyToSave((folder,file) => {
    currentFolder = folder;
    currentFile = file;
    window.api.updateFileContent(currentFolder,currentFile,contentBeforeReinitialization);
    ul.insertBefore(setupLi(file,false),ul.lastChild);
});

let timeoutHandle = null;

textarea.addEventListener("input",() => {
    if(timeoutHandle){
        clearTimeout(timeoutHandle);
    }
    timeoutHandle = setTimeout(() => {
        if(currentFile !== ""){
            window.api.updateFileContent(currentFolder,currentFile,textarea.value);
            timeoutHandle = null;
        }
    },INPUT_SAVE_DELAY*1000);
});