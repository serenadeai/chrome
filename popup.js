function clickHandler() {
  chrome.tabs.create({ url: this.getAttribute("href") });
  return false;
}

document.addEventListener("DOMContentLoaded", function () {
  document.querySelector("a").addEventListener("click", clickHandler);
});
