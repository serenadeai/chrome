import CommandHandler from "./command-handler";
import IPC from "./shared/ipc";

chrome.runtime.onInstalled.addListener(() => {
  const commandHandler = new CommandHandler();
  const ipc = new IPC(commandHandler, "chrome");
  commandHandler.setIPC(ipc);
  ipc.start();

  // If disconnected, show red badge
  window.setInterval(() => {
    if (!ipc.isConnected()) {
      chrome.browserAction.setBadgeText({ text: "X" });
      chrome.browserAction.setBadgeBackgroundColor({ color: "#a13a3a" });
    } else {
      chrome.browserAction.setBadgeText({ text: "" });
    }
  }, 1000);

  chrome.browserAction.onClicked.addListener(() => {
    const chromeDocs = "https://serenade.ai/docs";
    chrome.tabs.create({ url: chromeDocs });
  });
});
