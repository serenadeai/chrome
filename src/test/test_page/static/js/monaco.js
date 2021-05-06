var require = {
  paths: { vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.20.0/min/vs" },
};

var me;
var language = "text";

window.addEventListener("load", (_e) => {
  me = monaco.editor.create(document.getElementById("container"), {});
});

function showMonacoLanguages() {
  document.getElementById("monacoLanguages").classList.toggle("show");
}

function setMonacoLanguage(mode, language) {
  monaco.editor.setModelLanguage(me.getModel(), mode);
  document.getElementById("currentMonacoLanguage").textContent = language;
}

window.addEventListener("click", (event) => {
  if (!event.target.matches(".dropbtn")) {
    var dropdowns = document.getElementsByClassName("dropdown-content");
    var i;
    for (i = 0; i < dropdowns.length; i++) {
      var openDropdown = dropdowns[i];
      if (openDropdown.classList.contains("show")) {
        openDropdown.classList.remove("show");
      }
    }
  }
});
