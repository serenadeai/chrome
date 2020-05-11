import CommandHandler from "../command-handler";
import IPC from "../shared/ipc";
import Transformer from "../content/transformer";
import Port = chrome.runtime.Port;

/*
 * Handles commands from the client about the "editor" state.
 * In this case, the "editor" is the browser, but it may still
 * have an input selected.
 */

export default class EditorHandler {
  // These are declared by CommandHandler, which we extend
  ipc?: IPC;
  postAndWait?: (request: string, data?: any) => Promise<any>;

  async COMMAND_TYPE_GET_EDITOR_STATE(_data: any): Promise<any> {
    return new Promise((resolve) => {
      this.postAndWait!("activeElementSource").then((sourceResponse) => {
        this.postAndWait!("activeElementCursor").then((cursorResponse) => {
          if (sourceResponse === null) {
            resolve({
              message: "editorState",
              data: {
                useSystemInsert: true,
              },
            });
          }
          resolve({
            message: "editorState",
            data: {
              source: sourceResponse.activeElementSource,
              cursor: cursorResponse.activeElementCursor,
              filename: "",
              files: [],
              roots: [],
            },
          });
        });
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
    return this.postAndWait!("selectActiveElement", data);
  }
}
