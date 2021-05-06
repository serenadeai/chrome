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

editor.on("mousedown", (_i, _e) => {
  console.log("clicked");
});

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
