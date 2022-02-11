let monacoEditors: any[] = [];

function monacoListener() {
  (window as any).monaco.editor.onDidCreateEditor((e: any) => {
    monacoEditors.push(e);
  });
}

const mutationObserver = new MutationObserver((_mutations: any[], observer) => {
  if ((window as any).monaco?.editor) {
    monacoListener();
    observer.disconnect();
  }
});

document.addEventListener("DOMContentLoaded", (_e) => {
  if ((window as any).monaco?.editor) {
    monacoListener();
  } else {
    // The following attempts to add a Monaco listener for apps dynamically load the Monaco library
    // We add check for the monaco.editor library whenever nodes are added/removed from the DOM or attributes are changed
    let rootNode = document;
    mutationObserver.observe(rootNode!, {
      childList: true,
      subtree: true,
      attributes: true,
    });
    // If the observer is still running after 3s, the monaco object was never found
    setTimeout(() => {mutationObserver.disconnect()}, 3000);
  }
});

type EditorState = {
  source: string;
  cursor: number;
  filename: string;
  available: boolean;
};

const extensionAliasMap = {
  py: ["python"],
  js: ["javascript", "js", "typescript", "ts", "react", "vue"],
  java: ["java"], // must be after javascript
  html: ["html"],
  dart: ["dart"],
  rs: ["rust", "rs"],
  css: ["less", "sass", "css"],
  kt: ["kotlin", "kt"],
  go: ["go"],
  rb: ["ruby", "rb"],
  cs: ["csharp", "c#"],
  cpp: ["cplusplus", "c++", "cpp"],
  sh: ["sh"], // must be after c# to avoid returning file.sh instead of file.cs
  c: ["c"], // must be after all aliases that contain "c"
};
abstract class Editor {
  abstract active(): boolean;
  abstract getEditorState(): EditorState;
  abstract setSelection(cursor: number, cursorEnd: number): void;
  abstract setSourceAndCursor(source: string, cursor: number): void;
  abstract undo(): void;
  abstract redo(): void;

  cursorFromRowAndColumn(source: string, row: number, column: number): number {
    let cursor = 0;
    let sourceLines = source.split("\n");
    for (let index = 0; index < row; index++) {
      cursor += sourceLines[index].length + 1;
    }

    cursor += column;
    return cursor;
  }

  rowAndColumnFromCursor(source: string, cursor: number): { row: number; column: number } {
    let row = 0;
    let column = 0;
    for (let index = 0; index < cursor; index++) {
      if (source[index] == "\n") {
        row++;
        column = 0;
      } else {
        column++;
      }
    }

    return { row, column };
  }

  filenameFromLanguage(languageId: string): string {
    if (typeof languageId !== "string") {
      return "chrome.txt";
    }
    for (const [extension, aliases] of Object.entries(extensionAliasMap)) {
      for (const alias of aliases) {
        if (languageId.includes(alias)) {
          return "chrome." + extension;
        }
      }
    }
    return "chrome.txt";
  }
}

class Ace extends Editor {
  private editor(): any {
    const ace = document.activeElement!.closest(".ace_editor")!;
    const editor = (ace as any).env.editor;
    return editor;
  }

  active(): boolean {
    return !!document.activeElement && !!document.activeElement!.closest(".ace_editor")!;
  }

  getEditorState(): EditorState {
    const editor = this.editor();
    const source = editor.getValue();
    const { row, column } = editor.getCursorPosition();
    let modeParts = editor.session.getMode()["$id"].split("/");
    const mode = modeParts[modeParts.length - 1];
    return {
      source,
      cursor: this.cursorFromRowAndColumn(source, row, column),
      filename: this.filenameFromLanguage(mode),
      available: true,
    };
  }

  setSelection(cursor: number, cursorEnd: number) {
    const editor = this.editor();
    const source = editor.getValue();
    const positionStart = this.rowAndColumnFromCursor(source, cursor);
    const positionEnd = this.rowAndColumnFromCursor(source, cursorEnd);
    editor.session.selection.setRange(
      positionStart.row,
      positionStart.column,
      positionEnd.row,
      positionEnd.column
    );
  }

  setSourceAndCursor(source: string, cursor: number) {
    const editor = this.editor();
    editor.session.setValue(source);
    const { row, column } = this.rowAndColumnFromCursor(source, cursor);
    editor.session.selection.moveCursorTo(row, column);
  }

  redo() {}

  undo() {}
}

class CodeMirror extends Editor {
  private editor(): any {
    const codemirror = document.activeElement!.closest(".CodeMirror")!;
    return (codemirror as any).CodeMirror;
  }

  active(): boolean {
    return !!document.activeElement && !!document.activeElement.closest(".CodeMirror");
  }

  getEditorState(): EditorState {
    const editor = this.editor();
    const source = editor.getValue();
    const { line, ch } = editor.getCursor();
    let mode = editor.options.mode;
    if (mode && typeof mode !== "string" && mode.name) {
      mode = mode.name;
    }
    const filename = this.filenameFromLanguage(mode);
    return {
      source,
      cursor: this.cursorFromRowAndColumn(source, line, ch),
      filename: filename,
      available: true,
    };
  }

  setSelection(cursor: number, cursorEnd: number) {
    const editor = this.editor();
    const positionStart = this.rowAndColumnFromCursor(editor.getValue(), cursor);
    const positionEnd = this.rowAndColumnFromCursor(editor.getValue(), cursorEnd);
    editor.setSelection(
      { line: positionStart.row, ch: positionStart.column, sticky: null },
      { line: positionEnd.row, ch: positionEnd.column, sticky: null }
    );
  }

  setSourceAndCursor(source: string, cursor: number) {
    const editor = this.editor();
    editor.setValue(source);
    const { row, column } = this.rowAndColumnFromCursor(source, cursor);
    editor.setCursor(row, column);
  }

  redo() {
    const editor = this.editor();
    editor.redo();
  }

  undo() {
    const editor = this.editor();
    editor.undo();
  }
}

class Monaco extends Editor {
  private editor(): any {
    let activeNode = document.activeElement?.closest(".monaco-editor");
    for (const editor of monacoEditors) {
      if (editor.getDomNode() === activeNode) {
        return editor;
      }
    }
    return null;
  }

  active(): boolean {
    return !!document.activeElement && !!document.activeElement.closest(".monaco-editor");
  }

  getEditorState(): EditorState {
    const editor = this.editor();
    if (!editor) {
      return {
        source: "",
        cursor: 0,
        filename: "",
        available: false
      }
    }
    const model = editor.getModel();
    let languageId = "";
    if (model.getLanguageIdentifier) {
      languageId = model.getLanguageIdentifier().language;
    } else {
      languageId = model.getLanguageId();
    }
    let filename = this.filenameFromLanguage(languageId);
    const source = editor.getValue();
    const { lineNumber, column } = editor.getPosition();
    const cursor = this.cursorFromRowAndColumn(source, lineNumber - 1, column - 1);
    return {
      source: source,
      cursor: cursor,
      filename: filename,
      available: true,
    };
  }

  setSelection(cursor: number, cursorEnd: number) {
    const editor = this.editor();
    const source = editor.getValue();
    const range = editor.getModel()?.getFullModelRange();
    const positionStart = this.rowAndColumnFromCursor(source, cursor);
    const positionEnd = this.rowAndColumnFromCursor(source, cursorEnd);
    const selection = {
      selectionStartLineNumber: positionStart.row + 1,
      selectionStartColumn: positionStart.column + 1,
      positionLineNumber: positionEnd.row + 1,
      positionColumn: positionEnd.column + 1,
    };
    editor.executeEdits(
      null,
      [
        {
          range: range,
          text: source,
          forceMoveMarkers: true,
        },
      ],
      [selection]
    );
    editor.pushUndoStop();
  }

  setSourceAndCursor(source: string, cursor: number) {
    const editor = this.editor();
    const range = editor.getModel()?.getFullModelRange();
    const { row, column } = this.rowAndColumnFromCursor(source, cursor);
    const selection = {
      selectionStartLineNumber: row + 1,
      selectionStartColumn: column + 1,
      positionLineNumber: row + 1,
      positionColumn: column + 1,
    };
    editor.executeEdits(
      null,
      [
        {
          range: range,
          text: source,
          forceMoveMarkers: true,
        },
      ],
      [selection]
    );
    editor.pushUndoStop();
  }

  redo() {
    const editor = this.editor();
    editor.trigger(null, "redo");
  }

  undo() {
    const editor = this.editor();
    editor.trigger(null, "undo");
  }
}

class NativeInput extends Editor {
  active(): boolean {
    return (
      !!document.activeElement &&
      (document.activeElement!.tagName == "INPUT" || document.activeElement!.tagName == "TEXTAREA")
    );
  }

  getEditorState(): EditorState {
    const editor = document.activeElement as any;
    return {
      source: editor.value,
      cursor: editor.selectionStart,
      filename: "chrome.txt",
      available: true,
    };
  }

  setSelection(cursor: number, cursorEnd?: number) {
    const editor = document.activeElement as any;
    editor.setSelection(cursor, cursorEnd || cursor);
  }

  setSourceAndCursor(source: string, cursor: number) {
    const editor = document.activeElement as any;
    editor.value = source;
    editor.setSelection(cursor, cursor);
  }

  redo() {}

  undo() {}
}

const editors = [new Ace(), new CodeMirror(), new Monaco(), new NativeInput()];
export const active = (): Editor | null => {
  for (const editor of editors) {
    if (editor.active()) {
      return editor;
    }
  }

  return null;
};
