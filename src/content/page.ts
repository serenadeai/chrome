import * as editor from "./editor";
import * as navigator from "./navigator";

// Given a message, forward it to the appropriate content page handler.
// CommandHandler.postMessage expects a message before resolving, so each
// of these handlers MUST themselves call port.postMessage when complete.
chrome.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener((msg) => {
    switch (msg.request) {
      case "activeElementSource":
        editor.activeElementSource(port);
        break;
      case "activeElementCursor":
        editor.activeElementCursor(port);
        break;
      case "selectActiveElement":
        editor.selectActiveElement(port, msg.data);
        break;
      case "applyDiff":
        editor.applyDiff(port, msg.data);
        break;
      case "getClipboard":
        editor.getClipboard(port);
        break;
      case "copy":
        editor.copy(port, msg.data);
        break;
      case "setCursor":
        editor.setCursor(port, msg.data);
        break;
      case "scrollDirection":
        navigator.scrollDirection(port, msg.data);
        break;
      case "findMatchAndScroll":
        navigator.findMatchAndScroll(port, msg.data);
        break;
      case "navigateBack":
        window.history.back();
        port.postMessage({ success: true });
        break;
      case "navigateForward":
        window.history.forward();
        port.postMessage({ success: true });
        break;
      default:
        break;
    }
  });
});
