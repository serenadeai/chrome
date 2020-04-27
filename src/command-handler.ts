import ActionsHandler from "./actions-handler";
import TabHandler from "./tab-handler";
import NavigationHandler from "./navigation-handler";
import EditorHandler from "./editor-handler";

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
        Object.getOwnPropertyDescriptor(
          baseCtor.prototype,
          name
        ) as PropertyDescriptor
      );
    });
  });
}

applyMixins(CommandHandler, [
  ActionsHandler,
  EditorHandler,
  NavigationHandler,
  TabHandler,
]);

export default CommandHandler;
