import CommandHandler from "./command-handler";
import IPC from "./shared/ipc";

let commandHandler: CommandHandler;
let ipc: IPC;

function setIcon() {
  const icon_dir = ipc?.isConnected() ? "icon_default" : "icon_disconnected";

  chrome.browserAction.setIcon({
    path: {
      "16": `img/${icon_dir}/16x16.png`,
      "32": `img/${icon_dir}/32x32.png`,
      "48": `img/${icon_dir}/48x48.png`,
      "128": `img/${icon_dir}/128x128.png`,
    },
  });

  if (ipc?.isConnected()) {
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

function detectBrowser() {
  let userAgent = navigator.userAgent;
  if (userAgent.indexOf("Brave") !== -1) {
    return "brave";
  } else if (userAgent.indexOf("Edg") !== -1) {
    return "edge";
  }
  return "chrome";
}

window.setInterval(setIcon, 1000);

commandHandler = new CommandHandler();
const browserName = detectBrowser();
ipc = new IPC(commandHandler, browserName);
commandHandler.setIPC(ipc);
setIcon();

ipc.start();
showLoadingIndicator();
