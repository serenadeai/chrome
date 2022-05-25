import ExtensionCommandHandler from "./extension-command-handler";
import IPC from "./ipc";

const ensureConnection = async () => {
  await ipc.ensureConnection();
  ipc.sendActive();
  ipc.sendHeartbeat();
};

const extensionCommandHandler = new ExtensionCommandHandler();
const ipc = new IPC(
  navigator.userAgent.indexOf("Brave") != -1
    ? "brave"
    : navigator.userAgent.indexOf("Edg") != -1
    ? "edge"
    : "chrome",
  extensionCommandHandler
);

chrome.runtime.onStartup.addListener(async () => {
  await ensureConnection();
});

chrome.alarms.create("keepAlive", { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name == "keepAlive") {
    await ensureConnection();
  }
});

chrome.tabs.onActivated.addListener(async () => {
  await ensureConnection();
});

chrome.windows.onFocusChanged.addListener(async () => {
  await ensureConnection();
});

chrome.idle.onStateChanged.addListener(async (state) => {
  if (state == "active") {
    await ensureConnection();
  }
});

chrome.runtime.onMessage.addListener(async (message, _sender, _sendResponse) => {
  if (message.type == "reconnect") {
    await ensureConnection();
  }
});
