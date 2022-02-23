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

// Keep-alive logic
// Based on https://stackoverflow.com/a/66618269/15726648
let connection: any = null;
keepAlive();

chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "keepAlive") {
    connection = port;
    setTimeout(reconnect, 295000); // after 5 minutes minus 5 seconds, disconnect and reconnect
    port.onDisconnect.addListener(reconnect); // necessary to reconnect from different tabs
  }
});

function reconnect() {
  connection?.disconnect();
  connection = null;
  keepAlive();
}

async function availableTab() {
  const tabs = await chrome.tabs.query({ url: "*://*/*" });
  for (const tab of tabs) {
    // can't use in chrome:// tabs
    if (tab.id && tab.url && /^(file|https?):/.test(tab.url)) {
      return tab;
    }
  }
  return;
}

async function keepAlive() {
  if (connection) return;
  const tab = await availableTab();
  if (!tab) {
    // if no tabs are available, wait until a new tab is opened and try again
    chrome.tabs.onUpdated.addListener(tabUpdateCallback);
  } else {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id! },
      func: () => chrome.runtime.connect({ name: "keepAlive" })
    });
    chrome.tabs.onUpdated.removeListener(tabUpdateCallback);
  }
}

async function tabUpdateCallback(_tabId: any, changeInfo: any, _tab: any) {
  // Only try again when the url has changed (other updates include loading, changing favicons, etc...)
  if (changeInfo.url) {
    keepAlive();
  }
}
