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

function keepAlive() {
  chrome.alarms.create({ delayInMinutes: 2 });
}

chrome.alarms.onAlarm.addListener(keepAlive);
chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
  if (message.type === "reconnect") {
    ipc.ensureConnection();
  }
});
keepAlive();
