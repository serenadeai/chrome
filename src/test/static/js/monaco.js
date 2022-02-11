var require = {
  paths: {
    vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.32.1/min/vs",
  },
};

var me;
var language = "text";

window.addEventListener("load", (_e) => {
  me = monaco.editor.create(document.getElementById("monaco-container"), {});
});

function showMonacoLanguages() {
  document.getElementById("monacoLanguages").classList.toggle("show");
}

function setMonacoLanguage(mode, language) {
  monaco.editor.setModelLanguage(me.getModel(), mode);
  document.getElementById("currentMonacoLanguage").textContent = language;
}
