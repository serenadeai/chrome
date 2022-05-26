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
  if (alarm.name === "keepAlive") {
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
  if (state === "active") {
    await ensureConnection();
  }
});

chrome.runtime.onMessage.addListener(async (message, _sender, _sendResponse) => {
  if (message.type === "reconnect") {
    await ensureConnection();
  }
});

// The rest of this is adapted from the solution here:
// https://stackoverflow.com/questions/66618136/persistent-service-worker-in-chrome-extension/66618269
let lifeline: any = undefined;
keepAlive();

chrome.runtime.onConnect.addListener(port => {
  if (port.name === 'keepAlive') {
    lifeline = port;
    setTimeout(keepAliveForced, 4 * 60 * 1000); // under five minutes
    port.onDisconnect.addListener(keepAliveForced);
  }
});

function keepAliveForced() {
  lifeline?.disconnect();
  lifeline = null;
  keepAlive();
}

async function keepAlive() {
  if (lifeline) {
    return;
  }
  for (const tab of await chrome.tabs.query({
    url: '*://*/*'
  })) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab!.id! },
        func: () => chrome.runtime.connect({ name: 'keepAlive' }),
      });
      chrome.tabs.onUpdated.removeListener(retryOnTabUpdate);
      return;
    } catch (e) {}
  }
  chrome.tabs.onUpdated.addListener(retryOnTabUpdate);
}

async function retryOnTabUpdate(tabId: any, info: any, tab: any) {
  if (info.url && /^(file|https?):/.test(info.url)) {
    keepAlive();
  }
}
