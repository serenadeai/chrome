import CommandHandler from "./command-handler";
import IPC from "./shared/ipc";

chrome.runtime.onInstalled.addListener(() => {
  const commandHandler = new CommandHandler();
  const ipc = new IPC(commandHandler, "chrome");
  ipc.start();
});
