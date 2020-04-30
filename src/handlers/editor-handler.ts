import CommandHandler from "../command-handler";

/*
 * Handles commands from the client about the "editor" state.
 * In this case, the "editor" is the browser, but it may still
 * have an input selected.
 */

export default class EditorHandler {
  async COMMAND_TYPE_GET_EDITOR_STATE(_data: any): Promise<any> {
    const activeElementSource = () => {
      if (document.activeElement) {
        const element = document.activeElement as HTMLElement;
        if (element.tagName === "INPUT") {
          return (element as HTMLInputElement).value;
        } else if (element.contentEditable === "true") {
          return element.innerText;
        }
      }

      return false;
    };
    const activeElementCursor = () => {
      if (document.activeElement) {
        const element = document.activeElement as HTMLElement;
        if (element.tagName === "INPUT") {
          return (element as HTMLInputElement).selectionStart;
        } else if (element.contentEditable === "true") {
          return document.getSelection()!.anchorOffset;
        }
      }

      return 0;
    };

    return new Promise((resolve) => {
      CommandHandler.executeFunction(activeElementSource, (source) => {
        if (source[0] !== false) {
          CommandHandler.executeFunction(activeElementCursor, (cursor) => {
            console.log(source[0], cursor[0]);
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
    const activeElement = () => {
      return document.activeElement;
    };
    const codeForInput = `
      document.activeElement.value = \`${data.source}\`;
      document.activeElement.setSelectionRange(${data.cursor}, ${data.cursorEnd});
    `;

    return new Promise((resolve) => {
      CommandHandler.executeFunction(activeElement, (active) => {
        if (active[0] !== null) {
          CommandHandler.executeScript(codeForInput, (_result) => {
            resolve(null);
          });
        }
        resolve(null);
      });
    });
  }

  async COMMAND_TYPE_SELECT(data: any): Promise<any> {
    const activeElement = () => {
      return document.activeElement;
    };
    const setRange = (data: any) => {
      (document.activeElement! as HTMLInputElement).setSelectionRange(data.cursor, data.cursorEnd);
    };

    return new Promise((resolve) => {
      CommandHandler.executeFunction(activeElement, (active) => {
        if (active[0] !== null) {
          CommandHandler.executeFunctionWithArg(setRange, data, (_result) => {
            resolve(null);
          });
        }
        resolve(null);
      });
    });
  }
}
