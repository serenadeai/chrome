function clickHandler() {
  chrome.tabs.create({ url: this.getAttribute("href") });
  return false;
}

function reconnectHandler() {
  chrome.runtime.sendMessage("reconnect");
}

document.addEventListener("DOMContentLoaded", function () {
  document.querySelector("a").addEventListener("click", clickHandler);

  document.querySelector("#reconnect").addEventListener("click", reconnectHandler);
});
