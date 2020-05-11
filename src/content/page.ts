import Transformer from "./transformer";

chrome.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener((msg) => {
    if (msg.request === "activeElementSource") {
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

      return port.postMessage({ activeElementSource });
    } else if (msg.request === "activeElementCursor") {
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

      return port.postMessage({ activeElementCursor });
    } else if (msg.request === "selectActiveElement") {
      const data = msg.data;
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
      return port.postMessage({ success: true });
    }
  });
});
