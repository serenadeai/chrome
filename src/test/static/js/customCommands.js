window.addEventListener("load", (e) => {
  const textarea = document.querySelector("textarea");
  textarea.addEventListener("blur", (b) => {
    textarea.setAttribute("style", "background-color: #EFEFEF");
  });
  const button = document.querySelector("button");
  button.addEventListener("click", (c) => {
    button.setAttribute("style", "background-color: white");
  });
});
