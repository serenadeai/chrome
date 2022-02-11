var language = "text";

var editor = CodeMirror.fromTextArea(document.getElementsByClassName("cm")[0], {
  lineNumbers: true,
  mode: language,
  matchBrackets: true,
});

function showCMLanguages() {
  document.getElementById("codeMirrorLanguages").classList.toggle("show");
}

function setCMLanguage(mode, language) {
  editor.setOption("mode", mode);
  document.getElementById("currentCodeMirrorLanguage").textContent = language;
}
