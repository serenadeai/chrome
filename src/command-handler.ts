import { v4 as uuid } from "uuid";
import ActionsHandler from "./handlers/actions-handler";
import TabHandler from "./handlers/tab-handler";
import NavigationHandler from "./handlers/navigation-handler";
import EditorHandler from "./handlers/editor-handler";
import IPC from "./shared/ipc";
import Port = chrome.runtime.Port;
import { rejects } from "assert";

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

class Tab {
  private port: Port;
  private promises: Map<string, any>;
  private connected: boolean

  constructor(port: Port) {
    this.port = port
    this.promises = new Map();
    this.connected = true;
  }

  handleMessage(msg: any) {
    if (!this.promises.has(msg.callback)) {
      return;
    }
    this.promises.get(msg.callback)(msg.data);
    this.promises.delete(msg.callback);
  }

  disconnect() {
    this.connected = false;
    for (let callback of Array.from(this.promises.keys())) {
      this.cancel(callback);
    }
  }

  errorResponse() {
    return null;
  }

  async cancel(callback: string) {
    this.promises.get(callback)(this.errorResponse());
    this.promises.delete(callback);
  }

  async postMessage(request: string, data?: any): Promise<any> {
    if (!this.connected) {
      return this.errorResponse();
    }
    const callback = uuid();
    this.port.postMessage({ request, callback, data });
    return new Promise((resolve) => {
      this.promises.set(callback, resolve);
      setTimeout(() => {
        if (this.promises.has(callback)) {
          this.cancel(callback);
        }
      }, 60000);
    });
  }
}


export class CommandHandler {
  // We can use the extension's IPC to send messages back to the client if needed
  ipc?: IPC;

  tabs: Map<number, Tab> = new Map();

  constructor() {
    this.tabs = new Map<number, Tab>();
  }

  setIPC(ipc: IPC) {
    this.ipc = ipc;
  }

  // Opens a connection to the active tab if one isn't opened already.
  // https://developer.chrome.com/extensions/messaging#connect
  connectToActiveTab(): Promise<Tab> {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
        if (tabs.length) {
          const tabId = tabs[0].id;
          if (tabId) {
            // If we have one already, return it
            const existing = this.tabs.get(tabId);
            if (existing) {
              resolve(existing);
              return;
            }

            // Connect and save the port, and make sure we remove on disconnect
            // (navigation event in tab).        
            const port = chrome.tabs.connect(tabId, { name: tabId.toString() });
            const tab = new Tab(port);
            this.tabs.set(tabId, tab);
            port.onDisconnect.addListener((_: Port) => {
              void chrome.runtime.lastError; // tells chrome we're handling the error.
              tab.disconnect();
              this.tabs.delete(tabId);
            });
            port.onMessage.addListener(msg => {
              tab.handleMessage(msg);
            });
            resolve(tab);
            return;
          }
        }
        reject();
        return;
      });
    });
  }

  // Posts a message to the content script in the active tab, and waits for its response
  // as a promise.
  async postMessage(request: string, data?: any): Promise<any> {
    // create a deep copy, since we're mutating state
    const tab = await this.connectToActiveTab();
    return await tab.postMessage(request, data);
  }

  async resolvePostMessage(request: string, data?: any): Promise<void> {
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
