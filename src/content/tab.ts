import CommandHandler from "./command-handler";
import Editor from "./editor";
import Navigator from "./navigator";
import Notifications from "./notifications";
import Overlay from "./overlay";
import Transformer from "./transformer";
import Port = chrome.runtime.Port;

// Given a message, forward it to the appropriate content page handler.
// CommandHandler.postMessage expects a message before resolving, so each
// of these handlers MUST themselves call port.postMessage when complete.
chrome.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener(msg => Tab.handle(port, msg));
});

export default class Tab {
  static commandHandler = new CommandHandler();
  static editor = new Editor();
  static navigator = new Navigator();
  static notifications = new Notifications();
  static overlay = new Overlay();
  static transformer = new Transformer();

  static async handle(port: Port, msg: any): Promise<void> {
    const callback = msg.callback;
    if (msg.request in (Tab.commandHandler as any)) {
      const data = await (Tab.commandHandler as any)[msg.request](msg.data);
      port.postMessage({ callback, data });
    }
  }
}