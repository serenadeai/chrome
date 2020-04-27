import CommandHandler from "./command-handler";

/*
 * Handles commands from the client about the "editor" state.
 * In this case, the "editor" is the browser, but it may still
 * have an input selected.
 */

export default class EditorHandler {
  async COMMAND_TYPE_GET_EDITOR_STATE(_data: any): Promise<any> {
    const codeForSource = `
document.activeElement ? (
  document.activeElement.tagName == 'INPUT' ? document.activeElement.value : ""
) : ""`;
    const codeForCursor = `
document.activeElement ? (
  document.activeElement.tagName == 'INPUT' ? document.activeElement.selectionStart : 0
) : 0`;

    return new Promise((resolve) => {
      CommandHandler.executeScript(codeForSource, (source) => {
        CommandHandler.executeScript(codeForCursor, (cursor) => {
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
      });
    });
  }

  async COMMAND_TYPE_DIFF(data: any): Promise<any> {
    const codeForActive = `document.activeElement && document.activeElement.tagName`;
    const codeForInput = `document.activeElement.value = \`${data.source}\`; document.activeElement.setSelectionRange(${data.cursor}, ${data.cursor});`;

    return new Promise((resolve) => {
      CommandHandler.executeScript(codeForActive, (active) => {
        if (active[0] === "INPUT") {
          CommandHandler.executeScript(codeForInput, (_result) => {
            resolve(null);
          });
        } else {
          resolve(null);
        }
      });
    });
  }
}
