import Transformer from "./transformer";
import Port = chrome.runtime.Port;
import { shouldSkipEditorDomChanges } from "./utilities";
import { resolve } from "path";

export const editorState = async (port: Port, clickableCount: number) => {
  const source = await activeElementSource();
  const cursor = await activeElementCursor();
  const filename = await activeElementFilename();

  port.postMessage({ source, cursor, filename, clickableCount });
};

const activeElementIsCodeMirror = () => {
  const codeMirrorNodes = document.querySelectorAll(".CodeMirror");
  let isCodeMirror = false;
  codeMirrorNodes.forEach((node) => {
    if (node.contains(document.activeElement)) {
      isCodeMirror = true;
    }
  });
  return isCodeMirror;
};

const activeElementIsMonaco = () => {
  const monacoNodes = document.querySelectorAll(".monaco-editor");
  let isMonaco = false;
  monacoNodes.forEach((node) => {
    if (node.contains(document.activeElement)) {
      isMonaco = true;
    }
  });
  return isMonaco;
};

const getCodeMirror = async (value: string) => {
  const codeMirror = new Promise((resolve) => {
    document.addEventListener(
      "serenade-chrome-send-codemirror",
      (e) => resolve((e as any).detail[value]),
      { once: true }
    );
  });
  document.dispatchEvent(new CustomEvent("serenade-chrome-request-codemirror"));
  return codeMirror;
};

const getMonaco = async (value: string) => {
  const monaco = new Promise((resolve) => {
    document.addEventListener(
      "serenade-chrome-send-monaco",
      (e) => resolve((e as any).detail[value]),
      {
        once: true,
      }
    );
  });
  document.dispatchEvent(new CustomEvent("serenade-chrome-request-monaco"));
  return monaco;
};

// Finds the active element and gets its user-visible source in plaintext.
const activeElementSource = async () => {
  let activeElementSource: string | null = null;
  if (document.activeElement) {
    if (activeElementIsCodeMirror()) {
      activeElementSource = (await getCodeMirror("codeMirrorValue")) as string;
    } else if (activeElementIsMonaco()) {
      activeElementSource = (await getMonaco("monacoValue")) as string;
    }
    if (activeElementSource === null) {
      const element = document.activeElement as HTMLElement;
      if (element.tagName === "INPUT") {
        activeElementSource = (element as HTMLInputElement).value;
      } else if (element.tagName === "TEXTAREA") {
        activeElementSource = (element as HTMLTextAreaElement).value;
      } else if (element.isContentEditable) {
        activeElementSource = Transformer.getSource(element) || "";
      }
    }
  }
  return activeElementSource;
};

// Finds the active element and gets the cursor relative to user-visible source.
const activeElementCursor = async () => {
  let activeElementCursor: number | null = null;
  if (document.activeElement) {
    if (activeElementIsCodeMirror()) {
      activeElementCursor = (await getCodeMirror("codeMirrorCursor")) as number;
    } else if (activeElementIsMonaco()) {
      activeElementCursor = (await getMonaco("monacoCursor")) as number;
    }
    if (activeElementCursor === null) {
      const element = document.activeElement as HTMLElement;
      if (element.tagName === "INPUT") {
        activeElementCursor = (element as HTMLInputElement).selectionStart!;
      } else if (element.tagName === "TEXTAREA") {
        activeElementCursor = (element as HTMLTextAreaElement).selectionStart!;
      } else if (element.isContentEditable) {
        activeElementCursor = Transformer.getCursor();
      }
    }
  }
  return activeElementCursor;
};

// Finds the active element and gets the cursor relative to user-visible source.
const activeElementFilename = async () => {
  let activeElementFilename: string = "";
  if (document.activeElement) {
    if (activeElementIsCodeMirror()) {
      activeElementFilename = (await getCodeMirror("codeMirrorFilename")) as string;
    } else if (activeElementIsMonaco()) {
      activeElementFilename = (await getMonaco("monacoFilename")) as string;
    }
  }
  return activeElementFilename;
};

// Select the active element based on cursor start and end relative to user-visible source.
export const selectActiveElement = async (
  port: Port,
  data: { cursor: number; cursorEnd: number }
) => {
  if (document.activeElement) {
    let success = false;
    let status = new Promise((resolve) => {
      document.addEventListener(
        "set-selection-status",
        (e) => {
          resolve((e as any).detail.success);
        },
        { once: true }
      );
    });
    if (activeElementIsCodeMirror()) {
      document.dispatchEvent(
        new CustomEvent("serenade-chrome-set-codemirror-selection", {
          detail: {
            cursorStart: data.cursor,
            cursorEnd: data.cursorEnd,
          },
        })
      );
      success = (await status) as boolean;
    } else if (activeElementIsMonaco()) {
      document.dispatchEvent(
        new CustomEvent("serenade-chrome-set-monaco-selection", {
          detail: {
            cursorStart: data.cursor,
            cursorEnd: data.cursorEnd,
          },
        })
      );
      success = (await status) as boolean;
    }
    if (!success) {
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
  }
  port.postMessage({ success: true });
};

// Select the active element and set the cursor on it
export const setCursor = async (port: Port, data: { cursor: number }) => {
  if (document.activeElement) {
    let success = false;
    let status = new Promise((resolve) => {
      document.addEventListener(
        "set-selection-status",
        (e) => {
          resolve((e as any).detail.success);
        },
        { once: true }
      );
    });
    if (activeElementIsCodeMirror()) {
      document.dispatchEvent(
        new CustomEvent("serenade-chrome-set-codemirror-cursor", {
          detail: {
            cursor: data.cursor,
          },
        })
      );
      success = (await status) as boolean;
    } else if (activeElementIsMonaco()) {
      document.dispatchEvent(
        new CustomEvent("serenade-chrome-set-monaco-cursor", {
          detail: {
            cursor: data.cursor,
          },
        })
      );
      success = (await status) as boolean;
    }
    if (!success) {
      const element = document.activeElement as HTMLElement;
      if (element.tagName === "INPUT") {
        (element as HTMLInputElement).setSelectionRange(data.cursor, data.cursor);
      } else if (element.tagName === "TEXTAREA") {
        (element as HTMLTextAreaElement).setSelectionRange(data.cursor, data.cursor);
      } else if (element.isContentEditable) {
        Transformer.setCursor(data.cursor);
      }
    }
  }
  port.postMessage({ success: true, adjustCursor: null });
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

export const applyDiff = async (port: Port, data: any) => {
  let success = false;
  let status = new Promise((resolve) => {
    document.addEventListener(
      "set-source-status",
      (e) => {
        resolve((e as any).detail.success);
      },
      { once: true }
    );
  });
  if (activeElementIsCodeMirror()) {
    document.dispatchEvent(
      new CustomEvent("serenade-chrome-set-codemirror-source-and-cursor", {
        detail: {
          cursor: data.cursor,
          source: data.source,
        },
      })
    );
    success = (await status) as boolean;
  } else if (activeElementIsMonaco()) {
    document.dispatchEvent(
      new CustomEvent("serenade-chrome-set-monaco-source-and-cursor", {
        detail: {
          cursor: data.cursor,
          source: data.source,
        },
      })
    );
    success = (await status) as boolean;
  }
  return port.postMessage({ success: success });
};
