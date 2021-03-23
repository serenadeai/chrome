import Transformer from "./transformer";
import Port = chrome.runtime.Port;
import { shouldSkipEditorDomChanges } from "./utilities";

export const editorState = (port: Port, clickableCount: number) => {
  const source = activeElementSource();
  const cursor = activeElementCursor();

  port.postMessage({ source, cursor, clickableCount });
};

const codeMirrorInstanceFromActive = (activeElement: Element) => {
  if (document) {
    let codeMirrorInstances = document.getElementsByClassName("CodeMirror");
    for (const instance of Array.from(codeMirrorInstances)) {
      for (const childNode of Array.from(instance.childNodes)) {
        if (childNode.contains(activeElement)) {
          return instance;
        }
      }
    }
  }
  return null;
}

const getTextFromCodeMirror = (instance: Element) => {
  let output = "";
  if (document) {
    let codeLines = instance.getElementsByClassName("CodeMirror-line");
    for (const line of Array.from(codeLines)) {
      output += (line as HTMLElement).innerText + "\n"
    }
  }
  return output;
}

// Finds the active element and gets its user-visible source in plaintext.
const activeElementSource = () => {
  let activeElementSource: string | null = null;
  if (document.activeElement) {
    const element = document.activeElement as HTMLElement;
    if (document.getElementsByClassName("CodeMirror-code")) {
      if (codeMirrorInstanceFromActive(element)) {
        activeElementSource = getTextFromCodeMirror(codeMirrorInstanceFromActive(element)!);
      }
    } else if (element.tagName === "INPUT") {
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

// Select the active element and set the cursor on it
export const setCursor = (port: Port, data: { cursor: number }) => {
  if (shouldSkipEditorDomChanges()) {
    // send through system flow
    return port.postMessage({
      success: false,
      adjustCursor: data.cursor - activeElementCursor(),
    });
  }

  if (document.activeElement) {
    const element = document.activeElement as HTMLElement;
    if (element.tagName === "INPUT") {
      (element as HTMLInputElement).setSelectionRange(data.cursor, data.cursor);
    } else if (element.tagName === "TEXTAREA") {
      (element as HTMLTextAreaElement).setSelectionRange(data.cursor, data.cursor);
    } else if (element.isContentEditable) {
      Transformer.setCursor(data.cursor);
    }
  }
  port.postMessage({ success: true });
};

// Gets clipboard contents
export const getClipboard = (port: Port) => {
  navigator.clipboard
    .readText()
    .then((text) => {
      port.postMessage({ text });
    })
    .catch(() => {
      port.postMessage({ success: false });
    });
};

// Copies text to clipboard
export const copy = (port: Port, data: { text: string }) => {
  navigator.clipboard.writeText(data.text).then(() => {
    port.postMessage({ success: true });
  });
};
