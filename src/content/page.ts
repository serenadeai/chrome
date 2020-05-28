import Transformer from "./transformer";
import Port = chrome.runtime.Port;

// Finds the active element and gets its user-visible source in plaintext.
const activeElementSource = (port: Port) => {
  let activeElementSource: string | null = null;
  if (document.activeElement) {
    const element = document.activeElement as HTMLElement;
    if (element.tagName === "INPUT") {
      activeElementSource = (element as HTMLInputElement).value;
    } else if (element.tagName === "TEXTAREA") {
      activeElementSource = (element as HTMLTextAreaElement).value;
    } else if (element.isContentEditable) {
      activeElementSource = Transformer.getSource(element);
    }
  }
  port.postMessage({ activeElementSource });
};

// Finds the active element and gets the cursor relative to user-visible source.
const activeElementCursor = (port: Port) => {
  let activeElementCursor = 0;
  if (document.activeElement) {
    const element = document.activeElement as HTMLElement;
    if (element.tagName === "INPUT") {
      activeElementCursor = (element as HTMLInputElement).selectionStart!;
    } else if (element.tagName === "TEXTAREA") {
      activeElementCursor = (element as HTMLTextAreaElement).selectionStart!;
    } else if (element.isContentEditable) {
      activeElementCursor = Transformer.getCursor();
    }
  }
  port.postMessage({ activeElementCursor });
};

// Select the active element based on cursor start and end relative to user-visible source.
const selectActiveElement = (port: Port, data: { cursor: number; cursorEnd: number }) => {
  if (document.activeElement) {
    const element = document.activeElement as HTMLElement;
    const cursorEnd = data.cursorEnd < data.cursor ? data.cursor : data.cursorEnd;
    if (element.tagName === "INPUT") {
      (element as HTMLInputElement).setSelectionRange(data.cursor, cursorEnd);
    } else if (element.tagName === "TEXTAREA") {
      (element as HTMLTextAreaElement).setSelectionRange(data.cursor, cursorEnd);
    } else if (element.isContentEditable) {
      Transformer.setCursor(data.cursor, cursorEnd);
    }
  }
  port.postMessage({ success: true });
};

// Given a full diff, apply it to INPUT and TEXTAREA elements directly.
const applyDiff = (port: Port, data: { cursor: number; cursorEnd: number; source: string }) => {
  if (document.activeElement) {
    const element = document.activeElement as HTMLElement;
    const cursorEnd = data.cursorEnd < data.cursor ? data.cursor : data.cursorEnd;
    if (element.tagName === "INPUT") {
      (element as HTMLInputElement).value = data.source;
      (element as HTMLInputElement).setSelectionRange(data.cursor, cursorEnd);
      port.postMessage({ success: true });
    } else if (element.tagName === "TEXTAREA") {
      (element as HTMLTextAreaElement).value = data.source;
      (element as HTMLTextAreaElement).setSelectionRange(data.cursor, cursorEnd);
      port.postMessage({ success: true });
    } else if (element.isContentEditable) {
      // ContentEditable elements have another flow
      port.postMessage({ success: false });
    }
  }
};

// Select the active element and set the cursor on it
const setCursor = (port: Port, data: { cursor: number }) => {
  if (document.activeElement) {
    Transformer.setCursor(data.cursor);
  }
  port.postMessage({ success: true });
};

// Gets clipboard contents
const getClipboard = (port: Port) => {
  navigator.clipboard.readText().then((text) => {
    port.postMessage({ text });
  });
};

// Copies text to clipboard
const copy = (port: Port, data: { text: string }) => {
  navigator.clipboard.writeText(data.text).then(() => {
    port.postMessage({ success: true });
  });
};

const findMatchAndScroll = (port: Port, data: { path: string }) => {
  const path = data.path;
  // Matches based on content ("path")
  const snapshot = document.evaluate(
    `.//*[not(self::script)][not(self::noscript)][not(self::title)][not(self::meta)][not(self::svg)][not(self::img)][not(self::style)][text()[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${path}')]]`,
    document,
    null,
    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
    null
  );
  const matches = [];
  for (let i = 0; i < snapshot.snapshotLength; i++) {
    matches.push(snapshot.snapshotItem(i));
  }
  // A match that is below or to the right of the window
  let target = matches.find((node) => {
    const bounding = (node as Element).getBoundingClientRect();
    return bounding.top >= window.innerHeight || bounding.left >= window.innerWidth;
  });
  // If no match, look for the first match that is above the window
  if (target === undefined) {
    target = matches.find((node) => {
      const bounding = (node as Element).getBoundingClientRect();
      return bounding.top < 0 || bounding.left < 0;
    });
  }
  // If still no match (only match is in window), use the first one anyways
  if (target === undefined && matches.length) {
    target = matches[0];
  }
  // If still no match, stop
  if (target === undefined) {
    return;
  }
  const style = window.getComputedStyle(target as Element);
  const backgroundColor = style.getPropertyValue("background-color");
  (target as HTMLElement).style.backgroundColor = "yellow";
  (target as HTMLElement).style.transition = "background-color 0.5s";
  (target as Element).scrollIntoView({
    block: "center",
    inline: "center",
    behavior: "smooth",
  });
  window.setTimeout(() => {
    (target as HTMLElement).style.backgroundColor = backgroundColor;
  }, 2000);
  port.postMessage({ success: true });
};

chrome.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener((msg) => {
    switch (msg.request) {
      case "activeElementSource":
        activeElementSource(port);
        break;
      case "activeElementCursor":
        activeElementCursor(port);
        break;
      case "selectActiveElement":
        selectActiveElement(port, msg.data);
        break;
      case "applyDiff":
        applyDiff(port, msg.data);
        break;
      case "getClipboard":
        getClipboard(port);
        break;
      case "copy":
        copy(port, msg.data);
        break;
      case "setCursor":
        setCursor(port, msg.data);
        break;
      case "findMatchAndScroll":
        findMatchAndScroll(port, msg.data);
        break;
      default:
        break;
    }
  });
});
