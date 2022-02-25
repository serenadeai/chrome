import ExtensionCommandHandler from "./extension-command-handler";
import IPC from "./ipc";

const extensionCommandHandler = new ExtensionCommandHandler();
const ipc = new IPC(
  navigator.userAgent.indexOf("Brave") != -1
    ? "brave"
    : navigator.userAgent.indexOf("Edg") != -1
      ? "edge"
      : "chrome",
  extensionCommandHandler
);
ipc.start();

// Use alarm every minute to keep background service worker alive
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "keepAlive") {
    await ipc.ensureConnection();
  }
});
chrome.alarms.create("keepAlive", { periodInMinutes: 1 });

// Reset the extension when waking from idle state
chrome.idle.onStateChanged.addListener(async (state) => {
  if (state === "active") {
    await ipc.ensureConnection();
    ipc.sendActive();
  }
});

// Reset the extension when clicking the reconnect button
chrome.runtime.onMessage.addListener(async (message, _sender, _sendResponse) => {
  if (message.type === "reconnect") {
    await ipc.ensureConnection();
    ipc.sendActive();
  }
});
