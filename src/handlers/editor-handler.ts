import CommandHandler from "../command-handler";
import IPC from "../shared/ipc";
import Transformer from "../editor/transformer";

/*
 * Handles commands from the client about the "editor" state.
 * In this case, the "editor" is the browser, but it may still
 * have an input selected.
 */

export default class EditorHandler {
  ipc?: IPC;

  async COMMAND_TYPE_GET_EDITOR_STATE(_data: any): Promise<any> {
    const activeElementSource = () => {
      if (document.activeElement) {
        const element = document.activeElement as HTMLElement;
        if (element.tagName === "INPUT") {
          return (element as HTMLInputElement).value;
        } else if (element.tagName === "TEXTAREA") {
          return (element as HTMLTextAreaElement).value;
        } else if (element.isContentEditable) {
          return Transformer.getSource(element);
        }
      }

      return false;
    };
    const activeElementCursor = () => {
      if (document.activeElement) {
        const element = document.activeElement as HTMLElement;
        if (element.tagName === "INPUT") {
          return (element as HTMLInputElement).selectionStart;
        } else if (element.tagName === "TEXTAREA") {
          return (element as HTMLTextAreaElement).selectionStart;
        } else if (element.isContentEditable) {
          return Transformer.getCursor();
        }
      }

      return 0;
    };

    return new Promise((resolve) => {
      CommandHandler.executeFunction(activeElementSource, (source) => {
        if (source[0] !== false) {
          CommandHandler.executeFunction(activeElementCursor, (cursor) => {
            resolve({
              message: "editorState",
              data: {
                source: source[0],
                cursor: cursor[0],
                filename: "",
                files: [],
                roots: [],
              },
            });
          });
        } else {
          resolve({ message: "editorState", data: { useSystemInsert: true } });
        }
      });
    });
  }

  async COMMAND_TYPE_DIFF(data: any): Promise<any> {
    const setInputValue = (data: any) => {
      if (document.activeElement) {
        const element = document.activeElement as HTMLElement;
        const cursorEnd = data.cursorEnd < data.cursor ? data.cursor : data.cursorEnd;
        if (element.tagName === "INPUT") {
          (element as HTMLInputElement).value = data.source;
          (element as HTMLInputElement).setSelectionRange(data.cursor, cursorEnd);
        } else if (element.tagName === "TEXTAREA") {
          (element as HTMLTextAreaElement).value = data.source;
          (element as HTMLTextAreaElement).setSelectionRange(data.cursor, cursorEnd);
        } else if (element.isContentEditable) {
          Transformer.insertText(this.ipc!, 0, data.source);
          Transformer.setCursor(data.cursor);
        }
      }
    };

    return new Promise((resolve) => {
      CommandHandler.executeFunctionWithArg(setInputValue, data, (_result) => {
        resolve(null);
      });
    });
  }

  async COMMAND_TYPE_SELECT(data: any): Promise<any> {
    const setSelectionRange = (data: any) => {
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
    };

    return new Promise((resolve) => {
      CommandHandler.executeFunctionWithArg(setSelectionRange, data, (_result) => {
        resolve(null);
      });
    });
  }
}
