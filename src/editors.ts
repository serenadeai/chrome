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
    // We add check for the monaco.editor library whenever nodes are added/removed from the
    // DOM or attributes are changed
    let rootNode = document;
    mutationObserver.observe(rootNode!, {
      childList: true,
      subtree: true,
      attributes: true,
    });
    // If the observer is still running after 3s, the monaco object was never found
    setTimeout(() => {
      mutationObserver.disconnect();
    }, 3000);
  }
});

type EditorState = {
  source: string;
  cursor: number;
  filename: string;
  available: boolean;
  canGetState: boolean;
  canSetState: boolean;
};

const extensionAliasMap = {
  py: ["python"],
  js: ["javascript", "js", "typescript", "ts", "react", "vue"],
  // must be after javascript
  java: ["java"],
  html: ["html"],
  dart: ["dart"],
  rs: ["rust", "rs"],
  css: ["less", "sass", "css"],
  kt: ["kotlin", "kt"],
  go: ["go"],
  rb: ["ruby", "rb"],
  cs: ["csharp", "c#"],
  cpp: ["cplusplus", "c++", "cpp"],
  // must be after c# to avoid returning file.sh instead of file.cs
  sh: ["sh"],
  // must be after all aliases that contain "c"
  c: ["c"],
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
    return (ace as any).env.editor;
  }

  active(): boolean {
    return !!document.activeElement && !!document.activeElement!.closest(".ace_editor")!;
  }

  getEditorState(): EditorState {
    const editor = this.editor();
    const source = editor.getValue();
    const { row, column } = editor.getCursorPosition();
    const mode = editor.session["$modeId"];
    return {
      source,
      cursor: this.cursorFromRowAndColumn(source, row, column),
      filename: this.filenameFromLanguage(mode),
      available: true,
      canGetState: true,
      canSetState: true,
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

  redo() {
    this.editor().getSession().getUndoManager().redo();
  }

  undo() {
    this.editor().getSession().getUndoManager().undo();
  }
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
    let mode = editor.getMode();
    if (mode && typeof mode !== "string" && mode.name) {
      mode = mode.name;
    }

    return {
      source,
      cursor: this.cursorFromRowAndColumn(source, line, ch),
      filename: this.filenameFromLanguage(mode),
      available: true,
      canGetState: true,
      canSetState: true,
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
    this.editor()?.redo();
  }

  undo() {
    this.editor()?.undo();
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
        available: false,
        canGetState: false,
        canSetState: false,
      };
    }

    const model = editor.getModel();
    const languageId = model.getLanguageIdentifier
      ? model.getLanguageIdentifier().language
      : model.getLanguageId();

    const source = editor.getValue();
    const { lineNumber, column } = editor.getPosition();
    const cursor = this.cursorFromRowAndColumn(source, lineNumber - 1, column - 1);
    return {
      source: source,
      cursor: cursor,
      filename: this.filenameFromLanguage(languageId),
      available: true,
      canGetState: true,
      canSetState: true,
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
    this.editor()?.trigger(null, "redo");
  }

  undo() {
    this.editor()?.trigger(null, "undo");
  }
}

class NativeInput extends Editor {
  private maxUndoStackSize = 20;
  private nextCommandIndex: number = 0;
  private undoStacks: Map<Element, { source: string; cursor: number }[]> = new Map();

  private setSourceAndCursorOnActiveElement(source: string, cursor: number) {
    const editor = document.activeElement as any;
    editor.value = source;
    editor.setSelectionRange(cursor, cursor);
  }

  private undoStack(): { source: string; cursor: number }[] {
    const editor = document.activeElement as Element;
    console.log(editor);
    if (!this.undoStacks.has(editor)) {
      this.undoStacks.set(editor, []); 
    }
    return this.undoStacks.get(editor)!;
  }

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
      canGetState: true,
      canSetState: true,
    };
  }

  setSelection(cursor: number, cursorEnd?: number) {
    const editor = document.activeElement as any;
    editor.setSelectionRange(cursor, cursorEnd || cursor);
  }

  setSourceAndCursor(source: string, cursor: number) {
    const editor = document.activeElement as any;
    editor.value = source;
    editor.setSelectionRange(cursor, cursor);

    this.undoStack().splice(this.nextCommandIndex, this.undoStack().length - this.nextCommandIndex + 1);
    this.undoStack().push({ source, cursor });
    while (this.undoStack().length > this.maxUndoStackSize) {
      this.undoStack().shift();
    }
    this.nextCommandIndex = this.undoStack().length;
  }

  redo() {
    if (this.nextCommandIndex < this.undoStack().length) {
      const stackElement = this.undoStack()[this.nextCommandIndex];
      this.setSourceAndCursorOnActiveElement(stackElement.source, stackElement.cursor);
      this.nextCommandIndex++;
    }
  }

  undo() {
    if (this.nextCommandIndex - 1 >= 0) {
      this.nextCommandIndex--;
      const stackElement =
        this.nextCommandIndex - 1 >= 0
          ? this.undoStack()[this.nextCommandIndex - 1]
          : { source: "", cursor: 0 };
      this.setSourceAndCursorOnActiveElement(stackElement.source, stackElement.cursor);
    }
  }
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
