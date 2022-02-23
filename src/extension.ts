import ExtensionCommandHandler from "./extension-command-handler";
import IPC from "./ipc";

function connect() {
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
  return ipc
}

function keepAlive() {
  console.log(ipc?.isConnected())
  if (!ipc || !ipc.isConnected()) {
    ipc = connect();
  }
  chrome.alarms.create({ delayInMinutes: 2 });
}

let ipc = connect();
chrome.alarms.onAlarm.addListener(keepAlive);
chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
  if (message.type === "reconnect") {
    ipc = connect();
  }
});
keepAlive();
