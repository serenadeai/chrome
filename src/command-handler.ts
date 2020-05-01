import ActionsHandler from "./handlers/actions-handler";
import TabHandler from "./handlers/tab-handler";
import NavigationHandler from "./handlers/navigation-handler";
import EditorHandler from "./handlers/editor-handler";
import IPC from "./shared/ipc";

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

  setIPC(ipc: IPC) {
    this.ipc = ipc;
  }

  // Converts code to an anonymous function in a string so it can be called.
  static executeFunction(code: () => void, callback?: (data: any) => void) {
    CommandHandler.executeScript(`(${code.toString()})()`, callback);
  }

  // Pass an argument to the function.
  // Warning: This only works if the argument is serializable!
  static executeFunctionWithArg(
    code: (arg: any) => void,
    arg: any,
    callback?: (data: any) => void
  ) {
    CommandHandler.executeScript(`(${code.toString()})(${JSON.stringify(arg)})`, callback);
  }

  // Helper to run code in the active tab.
  static executeScript(code: string, callback?: (data: any) => void) {
    if (callback) {
      chrome.tabs.executeScript({ code }, (data) => callback(data));
    } else {
      chrome.tabs.executeScript({ code });
    }
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
