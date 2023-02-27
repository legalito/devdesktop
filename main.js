const textarea = document.querySelector("textarea");
const fileName = document.querySelector("#currentFileName");

window.api.setupFileListHandler((files) => {
  const ul = document.querySelector("#file-list");
  ul.innerHTML = "";
  for(const file of files) {
    const li = document.createElement("li");
    li.textContent = file;
    li.addEventListener("click", (
    ) => {
      fileName.textContent = file;
      window.api.getFileContent("", file, (content) => {
        textarea.value = content;
      });
    });
    ul.appendChild(li);
  }
});