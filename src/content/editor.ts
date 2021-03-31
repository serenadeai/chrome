import Transformer from "./transformer";
import Port = chrome.runtime.Port;
import { shouldSkipEditorDomChanges } from "./utilities";

export const editorState = (port: Port, clickableCount: number) => {
  const source = activeElementSource();
  const cursor = activeElementCursor();
  const filename = activeElementFilename();

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

// Finds the active element and gets its user-visible source in plaintext.
const activeElementSource = () => {
  let activeElementSource: string | null = null;
  document.addEventListener(
    "serenade-chrome-send-codemirror",
    (e) => {
      if ((e as any).detail.codeMirrorValue) {
        activeElementSource = (e as any).detail.codeMirrorValue;
      }
    },
    {
      once: true,
    }
  );
  document.dispatchEvent(new CustomEvent("serenade-chrome-request-codemirror"));
  document.addEventListener(
    "serenade-chrome-send-monaco",
    (e) => {
      if ((e as any).detail.monacoValue) {
        activeElementSource = (e as any).detail.monacoValue;
      }
    },
    {
      once: true,
    }
  );
  document.dispatchEvent(new CustomEvent("serenade-chrome-request-monaco"));

  if (document.activeElement && activeElementSource === null) {
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
  let activeElementCursor: number | null = null;
  document.addEventListener(
    "serenade-chrome-send-codemirror",
    (e) => {
      if ((e as any).detail.codeMirrorCursor) {
        activeElementCursor = (e as any).detail.codeMirrorCursor;
      }
    },
    {
      once: true,
    }
  );
  document.dispatchEvent(new CustomEvent("serenade-chrome-request-codemirror"));
  document.addEventListener(
    "serenade-chrome-send-monaco",
    (e) => {
      if ((e as any).detail.monacoCursor) {
        activeElementCursor = (e as any).detail.monacoCursor;
      }
    },
    {
      once: true,
    }
  );
  document.dispatchEvent(new CustomEvent("serenade-chrome-request-monaco"));

  if (document.activeElement && activeElementCursor === null) {
    const element = document.activeElement as HTMLElement;
    if (element.tagName === "INPUT") {
      activeElementCursor = (element as HTMLInputElement).selectionStart!;
    } else if (element.tagName === "TEXTAREA") {
      activeElementCursor = (element as HTMLTextAreaElement).selectionStart!;
    } else if (element.isContentEditable) {
      activeElementCursor = Transformer.getCursor();
    }
  }
  if (activeElementCursor === null) {
    activeElementCursor = 0;
  }
  return activeElementCursor;
};

// Finds the active element and gets the cursor relative to user-visible source.
const activeElementFilename = () => {
  let activeElementFilename: string = "";
  document.addEventListener(
    "serenade-chrome-send-codemirror",
    (e) => {
      if ((e as any).detail.codeMirrorFilename) {
        activeElementFilename = (e as any).detail.codeMirrorFilename;
      }
    },
    {
      once: true,
    }
  );
  document.dispatchEvent(new CustomEvent("serenade-chrome-request-codemirror"));
  document.addEventListener(
    "serenade-chrome-send-monaco",
    (e) => {
      if ((e as any).detail.monacoFilename) {
        activeElementFilename = (e as any).detail.monacoFilename;
      }
    },
    {
      once: true,
    }
  );
  document.dispatchEvent(new CustomEvent("serenade-chrome-request-monaco"));
  return activeElementFilename;
};

// Select the active element based on cursor start and end relative to user-visible source.
export const selectActiveElement = (port: Port, data: { cursor: number; cursorEnd: number }) => {
  if (document.activeElement) {
    if (activeElementIsCodeMirror()) {
      document.dispatchEvent(
        new CustomEvent("serenade-chrome-set-codemirror-selection", {
          detail: {
            cursorStart: data.cursor,
            cursorEnd: data.cursorEnd,
          },
        })
      );
    } else if (activeElementIsMonaco()) {
      document.dispatchEvent(
        new CustomEvent("serenade-chrome-set-monaco-selection", {
          detail: {
            cursorStart: data.cursor,
            cursorEnd: data.cursorEnd,
          },
        })
      );
    } else {
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
export const setCursor = (port: Port, data: { cursor: number }) => {
  if (shouldSkipEditorDomChanges()) {
    // send through system flow
    return port.postMessage({
      success: false,
      adjustCursor: data.cursor - activeElementCursor(),
    });
  }

  if (document.activeElement) {
    if (activeElementIsCodeMirror()) {
      document.dispatchEvent(
        new CustomEvent("serenade-chrome-set-codemirror-cursor", {
          detail: {
            cursor: data.cursor,
          },
        })
      );
    } else if (activeElementIsMonaco()) {
      document.dispatchEvent(
        new CustomEvent("serenade-chrome-set-monaco-cursor", {
          detail: {
            cursor: data.cursor,
          },
        })
      );
    } else {
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

export const applyDiff = (port: Port, data: any) => {
  if (activeElementIsCodeMirror()) {
    document.dispatchEvent(
      new CustomEvent("serenade-chrome-set-codemirror-source-and-cursor", {
        detail: {
          cursor: data.cursor,
          source: data.source,
        },
      })
    );
    return port.postMessage({ success: true });
  } else if (activeElementIsMonaco()) {
    document.dispatchEvent(
      new CustomEvent("serenade-chrome-set-monaco-source-and-cursor", {
        detail: {
          cursor: data.cursor,
          source: data.source,
        },
      })
    );
    return port.postMessage({ success: true });
  }
  return port.postMessage({ success: false });
};
