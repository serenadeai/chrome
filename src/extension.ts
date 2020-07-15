import CommandHandler from "./command-handler";
import IPC from "./shared/ipc";

let ipc: IPC;

function setIcon() {
  const icon_dir = ipc.isConnected() ? "icon_default" : "icon_disconnected";

  chrome.browserAction.setIcon({
    path: {
      "16": `img/${icon_dir}/16x16.png`,
      "32": `img/${icon_dir}/32x32.png`,
      "48": `img/${icon_dir}/48x48.png`,
      "128": `img/${icon_dir}/128x128.png`,
    },
  });

  if (ipc.isConnected()) {
    chrome.browserAction.setBadgeText({ text: "" });
  }
}

function showLoadingIndicator() {
  chrome.browserAction.setBadgeText({ text: "•••" });
  window.setTimeout(() => {
    // if still disconnected after three seconds, clear loading dots
    chrome.browserAction.setBadgeText({ text: "" });
  }, 3000);
}

chrome.runtime.onInstalled.addListener(() => {
  const commandHandler = new CommandHandler();
  ipc = new IPC(commandHandler, "chrome");
  commandHandler.setIPC(ipc);
  window.setInterval(setIcon, 1000);

  ipc.start();
  showLoadingIndicator();
});

chrome.runtime.onMessage.addListener((message) => {
  if (message === "reconnect") {
    ipc.ensureConnection();
    showLoadingIndicator();
  }
});
