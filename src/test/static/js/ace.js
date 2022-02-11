var language = "text";

var editor = ace.edit("aceEditor");

function showAceLanguages() {
  document.getElementById("aceLanguages").classList.toggle("show");
}

function setAceLanguage(mode, language) {
  editor.session.setMode(`${mode}`);
  document.getElementById("currentAceLanguage").textContent = language;
}
