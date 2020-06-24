/*
 * Handles commands from the client about the "editor" state.
 * In this case, the "editor" is the browser, but it may still
 * have an input selected.
 */

export default class EditorHandler {
  // These are declared by CommandHandler, which we extend
  postMessage?: (request: string, data?: any) => Promise<any>;
  resolvePostMessage?: (request: string, data?: any) => Promise<any>;

  async COMMAND_TYPE_GET_EDITOR_STATE(_data: any): Promise<any> {
    return new Promise((resolve) => {
      this.postMessage!("editorState")
        .then((response) => {
          if (response.source === null) {
            resolve({
              message: "editorState",
              data: {
                useSystemInsert: true,
                clickableCount: response.clickableCount,
              },
            });
          } else {
            resolve({
              message: "editorState",
              data: {
                source: response.source,
                cursor: response.cursor,
                clickableCount: response.clickableCount,
                filename: "",
                files: [],
                roots: [],
              },
            });
          }
        })
        .catch(() =>
          resolve({
            message: "editorState",
            data: {
              useSystemInsert: true,
            },
          })
        );
    });
  }

  async COMMAND_TYPE_COPY(data: any): Promise<any> {
    return this.resolvePostMessage!("copy", data);
  }

  async COMMAND_TYPE_PASTE(_data: any): Promise<any> {
    return new Promise((resolve) => {
      this.postMessage!("getClipboard").then((data) => {
        if (!data.success) {
          resolve({
            message: "paste",
          });
        } else {
          resolve({
            message: "insertText",
            data: {
              text: data.text,
            },
          });
        }
      });
    });
  }

  async COMMAND_TYPE_DIFF(data: any): Promise<any> {
    return new Promise((resolve) => {
      this.postMessage!("applyDiff", data).then((diffResponse) => {
        // If we're in a ContentEditable, first set the cursor somewhere,
        // use the IPC to tell the client to simulate keypresses/deletes.
        if (!diffResponse.success) {
          // delete then insert text
          if (
            data.deleteEnd !== undefined &&
            data.deleteStart !== undefined &&
            data.deleteEnd - data.deleteStart > 0
          ) {
            this.postMessage!("setCursor", { cursor: data.deleteEnd }).then(() => {
              resolve({
                message: "deleteText",
                data: {
                  deleteCount: data.deleteEnd - data.deleteStart,
                  text: data.insertDiff,
                },
              });
            });
          }
          // or just insert text
          else if (data.insertDiff !== undefined && data.insertDiff !== "") {
            this.postMessage!("setCursor", { cursor: data.deleteEnd }).then(() => {
              resolve({
                message: "insertText",
                data: {
                  text: data.insertDiff,
                },
              });
            });
          }
          // or just set the cursor
          else {
            this.postMessage!("setCursor", { cursor: data.cursor }).then(() => {
              resolve();
            });
          }
        } else {
          resolve();
        }
      });
    });
  }

  async COMMAND_TYPE_SELECT(data: any): Promise<any> {
    return this.resolvePostMessage!("selectActiveElement", data);
  }
}
