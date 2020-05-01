import CommandHandler from "../command-handler";
import IPC from "../shared/ipc";

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
          const selection = document.getSelection();
          if (selection) {
            const target = selection.focusNode ? selection.focusNode : selection.anchorNode;
            if (target) {
              return target.textContent;
            }
          }
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
          const selection = document.getSelection();
          if (selection) {
            if (selection.focusNode) {
              return selection.focusOffset;
            } else if (selection.anchorNode) {
              return selection.anchorOffset;
            }
          }
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
          const selection = document.getSelection();
          if (selection) {
            let target = selection.focusNode ? selection.focusNode : selection.anchorNode;
            if (target) {
              // Set the textContent of the node the cursor is on
              target.textContent = data.source;
              // If the target is not itself a text node, find a child that is
              if (target.nodeType !== Node.TEXT_NODE && target.hasChildNodes()) {
                const children = target.childNodes;
                for (let i = 0; i < children.length; i++) {
                  if (children[i].nodeType === Node.TEXT_NODE) {
                    target = children[i];
                    break;
                  }
                }
              }
              // Now we can safely set the cursor
              selection.collapse(target, data.cursor);
            }
          }
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
          const selection = document.getSelection();
          if (selection) {
            let target = selection.focusNode ? selection.focusNode : selection.anchorNode;
            if (target) {
              if (target.nodeType !== Node.TEXT_NODE && target.hasChildNodes()) {
                const children = target.childNodes;
                for (let i = 0; i < children.length; i++) {
                  if (children[i].nodeType === Node.TEXT_NODE) {
                    target = children[i];
                    break;
                  }
                }
              }
              selection.setBaseAndExtent(target, data.cursor, target, cursorEnd);
            }
          }
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
