import CommandHandler from "./command-handler";
import IPC from "./shared/ipc";
import BaseCommandHandler from "./shared/command-handler";

chrome.runtime.onInstalled.addListener(() => {
  const commandHandler = new CommandHandler();
  // TODO: Our CommandHandler needs to eventually implement BaseCommandHandler, but currently does not
  const ipc = new IPC(commandHandler as unknown as BaseCommandHandler, "chrome");
  ipc.start();
});