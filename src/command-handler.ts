import ActionsHandler from "./handlers/actions-handler";
import TabHandler from "./handlers/tab-handler";
import NavigationHandler from "./handlers/navigation-handler";
import EditorHandler from "./handlers/editor-handler";
import IPC from "./shared/ipc";
import Port = chrome.runtime.Port;

/*
 * The CommandHandler class is a wrapper around other handlers
 * for each category of commands.
 *
 * This needs to be composed with "mixins" since TypeScript currently
 * only allows extending one class.
 */

export interface CommandHandler
  extends ActionsHandler,
    EditorHandler,
    NavigationHandler,
    TabHandler {}

export class CommandHandler {
  // We can use the extension's IPC to send messages back to the client if needed
  ipc?: IPC;

  ports: Map<number, Port>;

  constructor() {
    this.ports = new Map<number, Port>();
  }

  setIPC(ipc: IPC) {
    this.ipc = ipc;
  }

  // Opens a connection to the active tab if one isn't opened already.
  // https://developer.chrome.com/extensions/messaging#connect
  connectToActiveTab(): Promise<Port> {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
        if (tabs.length) {
          const tabId = tabs[0].id;
          if (tabId) {
            // If we have one already, return it
            if (this.ports.get(tabId)) {
              resolve(this.ports.get(tabId));
            }

            // Connect and save the port, and make sure we remove on disconnect
            // (navigation event in tab).
            const port = chrome.tabs.connect(tabId, { name: tabId.toString() });
            this.ports.set(tabId, port);
            port.onDisconnect.addListener((port: Port) => {
              this.ports.delete(parseInt(port.name, 10));
            });

            resolve(port);
          }
        }
        reject();
      });
    });
  }

  // Posts a message to the content script in the active tab, and waits for its response
  // as a promise.
  async postMessage(request: string, data?: any): Promise<any> {
    const port = await this.connectToActiveTab();

    const responsePromise = new Promise((resolve, reject) => {
      port.onMessage.addListener((msg) => {
        resolve(msg);
      });
      port.onDisconnect.addListener((_port: Port) => {
        reject();
      });
    });

    port.postMessage({ request, data });

    return responsePromise;
  }

  // Posts a message and resolve even if it fails
  async resolvePostMessage(request: string, data?: any): Promise<any> {
    return new Promise((resolve) => {
      this.postMessage!(request, data)
        .then(() => {
          resolve();
        })
        .catch(() => {
          resolve();
        });
    });
  }
}

// From https://www.typescriptlang.org/docs/handbook/mixins.html
function applyMixins(derivedCtor: any, baseCtors: any[]) {
  baseCtors.forEach((baseCtor) => {
    Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
      Object.defineProperty(
        derivedCtor.prototype,
        name,
        Object.getOwnPropertyDescriptor(baseCtor.prototype, name) as PropertyDescriptor
      );
    });
  });
}

applyMixins(CommandHandler, [ActionsHandler, EditorHandler, NavigationHandler, TabHandler]);

export default CommandHandler;
