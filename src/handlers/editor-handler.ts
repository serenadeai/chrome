import IPC from "../shared/ipc";

/*
 * Handles commands from the client about the "editor" state.
 * In this case, the "editor" is the browser, but it may still
 * have an input selected.
 */

export default class EditorHandler {
  // These are declared by CommandHandler, which we extend
  ipc?: IPC;
  postMessage?: (request: string, data?: any) => Promise<any>;

  async COMMAND_TYPE_GET_EDITOR_STATE(_data: any): Promise<any> {
    return new Promise((resolve) => {
      this.postMessage!("activeElementSource").then((sourceResponse) => {
        this.postMessage!("activeElementCursor").then((cursorResponse) => {
          if (sourceResponse === null) {
            resolve({
              message: "editorState",
              data: {
                useSystemInsert: true,
              },
            });
          } else {
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
          }
        });
      });
    });
  }

  async COMMAND_TYPE_DIFF(data: any): Promise<any> {
    return new Promise((resolve) => {
      this.postMessage!("applyDiff", data).then((diffResponse) => {
        // If we're in a ContentEditable, first set the cursor somewhere,
        // use the IPC to tell the client to simulate keypresses/deletes,
        // and then set the cursor again.
        if (!diffResponse.success) {
          const insertCursorStart = 2;
          const insertCursorEnd = 30;
          this.postMessage!("setCursor", { cursor: insertCursorStart }).then(() => {
            resolve({
              message: "insertText",
              data: {
                text: `test string`,
              },
            });
            // this.postMessage!("setCursor", { cursor: insertCursorEnd }).then(() => {
            //   resolve();
            // });
          });
        } else {
          resolve();
        }
      });
    });
  }

  async COMMAND_TYPE_SELECT(data: any): Promise<any> {
    return this.postMessage!("selectActiveElement", data);
  }
}
