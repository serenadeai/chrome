var language = "text";

var aceEditor = ace.edit("aceEditor");

function showAceLanguages() {
  document.getElementById("aceLanguages").classList.toggle("show");
}

function setAceLanguage(mode, language) {
  aceEditor.session.setMode(`${mode}`);
  document.getElementById("currentAceLanguage").textContent = language;
}
