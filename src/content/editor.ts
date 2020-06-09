import Transformer from "./transformer";
import Port = chrome.runtime.Port;

export const editorState = (port: Port, clickableCount: number) => {
  const source = activeElementSource();
  const cursor = activeElementCursor();

  port.postMessage({ source, cursor, clickableCount });
};

// Finds the active element and gets its user-visible source in plaintext.
const activeElementSource = () => {
  let activeElementSource: string | null = null;
  if (document.activeElement) {
    const element = document.activeElement as HTMLElement;
    if (element.tagName === "INPUT") {
      activeElementSource = (element as HTMLInputElement).value;
    } else if (element.tagName === "TEXTAREA") {
      activeElementSource = (element as HTMLTextAreaElement).value;
    } else if (element.isContentEditable) {
      activeElementSource = Transformer.getSource(element) || "";
    }
  }
  return activeElementSource;
};

// Finds the active element and gets the cursor relative to user-visible source.
const activeElementCursor = () => {
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
  return activeElementCursor;
};

// Select the active element based on cursor start and end relative to user-visible source.
export const selectActiveElement = (port: Port, data: { cursor: number; cursorEnd: number }) => {
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
export const applyDiff = (
  port: Port,
  data: { cursor: number; cursorEnd: number; source: string }
) => {
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
export const setCursor = (port: Port, data: { cursor: number }) => {
  if (document.activeElement) {
    Transformer.setCursor(data.cursor);
  }
  port.postMessage({ success: true });
};

// Gets clipboard contents
export const getClipboard = (port: Port) => {
  navigator.clipboard.readText().then((text) => {
    port.postMessage({ text });
  });
};

// Copies text to clipboard
export const copy = (port: Port, data: { text: string }) => {
  navigator.clipboard.writeText(data.text).then(() => {
    port.postMessage({ success: true });
  });
};
