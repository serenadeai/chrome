import * as actions from "./actions";
import * as editor from "./editor";
import * as navigator from "./navigator";
import * as utilities from "./utilities";

// Store list of clickable elements for `show links | inputs | code`, `click`, and `use`.
let clickables: Node[] = [];
let clickableType: "click" | "copy" | null = null;

// Given a message, forward it to the appropriate content page handler.
// CommandHandler.postMessage expects a message before resolving, so each
// of these handlers MUST themselves call port.postMessage when complete.
chrome.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener((msg) => {
    switch (msg.request) {
      /* Editor */
      case "editorState":
        editor.editorState(port, clickables.length);
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
      /* Navigator */
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
      /* Actions */
      case "clearOverlays":
        actions.clearOverlays(port);
        clickables = [];
        clickableType = null;
        break;
      case "showOverlay":
        clickables = actions.showOverlay(port, msg.data);
        clickableType = msg.data.overlayType === "code" ? "copy" : "click";
        break;
      case "click":
        clickables = actions.click(port, msg.data, clickables);
        break;
      case "findClickable":
        actions.findClickable(port, msg.data, clickables);
        break;
      case "useClickable":
        if (clickables.length === 0) {
          port.postMessage({ success: true });
        }
        if (clickableType === "copy") {
          actions.copyClickable(port, msg.data, clickables);
        } else if (clickableType === "click") {
          clickables = actions.click(port, { path: msg.data.index }, clickables);
        } else {
          port.postMessage({ success: true });
        }
        break;
      /* Utilities */
      case "showNotification":
        utilities.showNotification(port, msg.data);
        break;
      default:
        break;
    }
  });
});
