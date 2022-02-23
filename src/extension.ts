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
