import ExtensionCommandHandler from "./extension-command-handler";
import IPC from "./ipc";

const extensionCommandHandler = new ExtensionCommandHandler();
let ipc = connect();

function connect() {
  let ipc = new IPC(
    navigator.userAgent.indexOf("Brave") != -1
      ? "brave"
      : navigator.userAgent.indexOf("Edg") != -1
        ? "edge"
        : "chrome",
    extensionCommandHandler
  );
  ipc.start();
  return ipc
}

function checkConnection() {
  if (!ipc) {
    ipc = connect();
  } else {
    ipc.ensureConnection();
  }
}

// Use alarm every minute to keep background service worker alive
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "keepAlive") {
    checkConnection()
  }
});
chrome.alarms.create("keepAlive", { periodInMinutes: 1 });

// Reset the extension when waking from idle state
chrome.idle.onStateChanged.addListener(async (state) => {
  if (state === "active") {
    chrome.runtime.reload();
    await chrome.tabs.reload();
  }
});

// Reset the extension when clicking the reconnect button
chrome.runtime.onMessage.addListener(async (message, _sender, _sendResponse) => {
  if (message.type === "reconnect") {
    chrome.runtime.reload();
    await chrome.tabs.reload();
  }
});
