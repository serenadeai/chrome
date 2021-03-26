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
                filename: response.filename,
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
    // Try to set the source directly using the CodeMirror APIs, otherwise
    // fall back to setting the cursor ourselves and passing the remaining
    // text to the client to simulate keypresses.
    return new Promise((resolve) => {
      this.postMessage!("applyDiff", {
        source: data.source,
        cursor: data.cursor,
      }).then((applyDiffResponse) => {
        if (applyDiffResponse.success) {
          resolve(applyDiffResponse);
        } else {
          const cursor =
            (data.deleteEnd !== undefined &&
              data.deleteStart !== undefined &&
              data.deleteEnd - data.deleteStart !== 0) ||
            (data.insertDiff !== undefined && data.insertDiff !== "")
              ? data.deleteEnd
              : data.cursor;

          this.postMessage!("setCursor", { cursor }).then((cursorResponse) => {
            resolve({
              message: "applySystemDiff",
              data: {
                adjustCursor: cursorResponse.adjustCursor,
                deleteCount: data.deleteEnd - data.deleteStart,
                text: data.insertDiff,
              },
            });
          });
        }
      });
    });
  }

  async COMMAND_TYPE_SELECT(data: any): Promise<any> {
    return this.resolvePostMessage!("selectActiveElement", data);
  }
}
