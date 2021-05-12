import Tab from "./tab";

export default class Editor {
  activeElementIsCodeMirror(): boolean {
    const codeMirrorNodes = document.querySelectorAll(".CodeMirror");
    let isCodeMirror = false;
    codeMirrorNodes.forEach((node) => {
      if (node.contains(document.activeElement)) {
        isCodeMirror = true;
      }
    });
    return isCodeMirror;
  }

  activeElementIsMonaco = () => {
    const monacoNodes = document.querySelectorAll(".monaco-editor");
    let isMonaco = false;
    monacoNodes.forEach((node) => {
      if (node.contains(document.activeElement)) {
        isMonaco = true;
      }
    });
    return isMonaco;
  };

  getCodeMirror = async (value: string) => {
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

  async getMonaco(value: string) {
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
  }

  // Finds the active element and gets its user-visible source in plaintext.
  async activeElementSource() {
    let activeElementSource: string | null = null;
    if (document.activeElement) {
      if (this.activeElementIsCodeMirror()) {
        activeElementSource = (await this.getCodeMirror("codeMirrorValue")) as string;
      } else if (this.activeElementIsMonaco()) {
        activeElementSource = (await this.getMonaco("monacoValue")) as string;
      }
      if (activeElementSource === null) {
        const element = document.activeElement as HTMLElement;
        if (element.tagName === "INPUT") {
          activeElementSource = (element as HTMLInputElement).value;
        } else if (element.tagName === "TEXTAREA") {
          activeElementSource = (element as HTMLTextAreaElement).value;
        } else if (element.isContentEditable) {
          activeElementSource = Tab.transformer.getSource(element);
        }
      }
    }
    return activeElementSource;
  }

  // Finds the active element and gets the cursor relative to user-visible source.
  async activeElementCursor(): Promise<number | null> {
    let activeElementCursor: number | null = null;
    if (document.activeElement) {
      if (this.activeElementIsCodeMirror()) {
        activeElementCursor = (await this.getCodeMirror("codeMirrorCursor")) as number;
      } else if (this.activeElementIsMonaco()) {
        activeElementCursor = (await this.getMonaco("monacoCursor")) as number;
      }
      if (activeElementCursor === null) {
        const element = document.activeElement as HTMLElement;
        if (element.tagName === "INPUT") {
          activeElementCursor = (element as HTMLInputElement).selectionStart!;
        } else if (element.tagName === "TEXTAREA") {
          activeElementCursor = (element as HTMLTextAreaElement).selectionStart!;
        } else if (element.isContentEditable) {
          activeElementCursor = Tab.transformer.getCursor();
        }
      }
    }
    return activeElementCursor;
  }

  // Finds the active element and gets the cursor relative to user-visible source.
  async activeElementFilename(): Promise<string> {
    let activeElementFilename: string = "";
    if (document.activeElement) {
      if (this.activeElementIsCodeMirror()) {
        activeElementFilename = (await this.getCodeMirror("codeMirrorFilename")) as string;
      } else if (this.activeElementIsMonaco()) {
        activeElementFilename = (await this.getMonaco("monacoFilename")) as string;
      }
    }
    return activeElementFilename;
  }

  // Select the active element based on cursor start and end relative to user-visible source.
  public async selectActiveElement(cursorStart: number, cursorEnd: number): Promise<boolean> {
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
      if (this.activeElementIsCodeMirror()) {
        document.dispatchEvent(
          new CustomEvent("serenade-chrome-set-codemirror-selection", {
            detail: {
              cursorStart,
              cursorEnd,
            },
          })
        );
        success = (await status) as boolean;
      } else if (this.activeElementIsMonaco()) {
        document.dispatchEvent(
          new CustomEvent("serenade-chrome-set-monaco-selection", {
            detail: {
              cursorStart,
              cursorEnd,
            },
          })
        );
        success = (await status) as boolean;
      }
      if (!success) {
        const element = document.activeElement as HTMLElement;
        cursorEnd = cursorEnd < cursorStart ? cursorStart : cursorEnd;
        if (element.tagName === "INPUT") {
          (element as HTMLInputElement).setSelectionRange(cursorStart, cursorEnd);
        } else if (element.tagName === "TEXTAREA") {
          (element as HTMLTextAreaElement).setSelectionRange(cursorStart, cursorEnd);
        } else if (element.isContentEditable) {
          Tab.transformer.setCursor(cursorStart, cursorEnd);
        }
      }
    }
    return true;
  }

  // Select the active element and set the cursor on it
  public async setCursor(cursor: number): Promise<void> {
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
      if (this.activeElementIsCodeMirror()) {
        document.dispatchEvent(
          new CustomEvent("serenade-chrome-set-codemirror-cursor", {
            detail: {
              cursor: cursor,
            },
          })
        );
        success = (await status) as boolean;
      } else if (this.activeElementIsMonaco()) {
        document.dispatchEvent(
          new CustomEvent("serenade-chrome-set-monaco-cursor", {
            detail: {
              cursor: cursor,
            },
          })
        );
        success = (await status) as boolean;
      }
      if (!success) {
        const element = document.activeElement as HTMLElement;
        if (element.tagName === "INPUT") {
          (element as HTMLInputElement).setSelectionRange(cursor, cursor);
        } else if (element.tagName === "TEXTAREA") {
          (element as HTMLTextAreaElement).setSelectionRange(cursor, cursor);
        } else if (element.isContentEditable) {
          Tab.transformer.setCursor(cursor);
        }
      }
    }
  }

  public async applyDiff(source: string, cursor: number) {
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
    if (this.activeElementIsCodeMirror()) {
      document.dispatchEvent(
        new CustomEvent("serenade-chrome-set-codemirror-source-and-cursor", {
          detail: {
            cursor: cursor,
            source: source,
          },
        })
      );
      success = (await status) as boolean;
    } else if (this.activeElementIsMonaco()) {
      document.dispatchEvent(
        new CustomEvent("serenade-chrome-set-monaco-source-and-cursor", {
          detail: {
            cursor: cursor,
            source: source,
          },
        })
      );
      success = (await status) as boolean;
    }
    return success;
  }
}
