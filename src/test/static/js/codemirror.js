var language = "text";

var cmEditor = CodeMirror.fromTextArea(document.getElementsByClassName("cm")[0], {
  lineNumbers: true,
  mode: language,
  matchBrackets: true,
});

function showCMLanguages() {
  document.getElementById("codeMirrorLanguages").classList.toggle("show");
}

function setCMLanguage(mode, language) {
  cmEditor.setOption("mode", mode);
  document.getElementById("currentCodeMirrorLanguage").textContent = language;
}
