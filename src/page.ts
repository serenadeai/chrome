const langModes: { [key: string]: string[] } = {
  Default: [
    "plaintext",
    "markdown",
    "ipythongfm",
    "gfm",
    "text/plain",
    "text/x-ipythongfm",
    "text/x-markdown",
  ],
  Bash: ["text/x-sh", "bash"],
  "C/C++": ["c", "c++", "csrc", "c++src", "text/x-c", "text/x-c++", "text/x-csrc", "text/x-c++src"],
  "CSS/SCSS": [
    "css",
    "less",
    "sass",
    "scss",
    "text/x-sass",
    "text/x-css",
    "text/x-less",
    "text/x-scss",
  ],
  Dart: ["dart", "application/dart"],
  HTML: ["html", "text/html"],
  Java: ["java", "text/x-java"],
  JavaScript: [
    "javascript",
    "typescript",
    "vue",
    "jsx",
    "tsx",
    "tsx",
    "application/javascript",
    "application/x-javascript",
    "application/typescript",
    "text/javascript",
    "text/x-javascript",
    "text/x-typescript",
    "text/x-vue",
    "text/jsx",
    "text/typescript-jsx",
    "replit-js-v1",
  ],
  Kotlin: ["kotlin", "text/x-kotlin"],
  Python: ["text/x-python", "text/x-ipython", "ipython", "replit-python-v3", "notebook-python"],
};

const languageExtensions: { [key: string]: string[] } = {
  Default: ["txt"],
  Bash: ["sh", "bash"],
  "C/C++": ["cpp", "cc", "cxx", "c++", "hpp", "hh", "hxx", "h++", "c", "h"],
  "CSS/SCSS": ["scss", "less", "css"],
  Dart: ["dart"],
  HTML: ["html"],
  Java: ["java"],
  JavaScript: ["tsx", "js", "jsx", "ts", "vue"],
  Kotlin: ["kt"],
  Python: ["py"],
};

var monacoEditors: any[] = [];

window.onload = (_e: any) => {
  (window as any).monaco?.editor?.onDidCreateEditor((e: any) => {
    monacoEditors.push(e);
  });
};

const getMonaco = () => {
  let focused: any | null = null;
  monacoEditors.forEach((e) => {
    if (e.hasTextFocus()) {
      focused = e;
    }
  });
  return focused;
};

const getCodeMirror = () => {
  const codeMirrorNodes = document.querySelectorAll(".CodeMirror");
  let activeCodeMirrorNode: Node | null = null;
  codeMirrorNodes.forEach((node) => {
    if (node.contains(document.activeElement)) {
      activeCodeMirrorNode = node;
    }
  });
  return (activeCodeMirrorNode as any)?.CodeMirror;
};

const getFilenameFromCodeMirror = (cm: any) => {
  let mode = cm.options.mode;
  if (mode && typeof mode !== "string" && mode.name) {
    mode = mode.name;
  }
  for (const [language, modes] of Object.entries(langModes)) {
    if (modes.includes(mode)) {
      return "chrome." + languageExtensions[language][0];
    }
  }
  return "";
};

const getFilenameFromMonaco = (model: any) => {
  let mode = model?.getModeId();
  for (const [language, modes] of Object.entries(langModes)) {
    if (modes.includes(mode)) {
      return "chrome." + languageExtensions[language][0];
    }
  }
  return "";
};

const cursorFromPosition = (position: any, source: string, editor: string) => {
  if (source && position) {
    let line: number = 0;
    let ch: number = 0;
    if (editor === "codemirror") {
      line = position.line;
      ch = position.ch;
    } else if (editor === "monaco") {
      // monaco is 1-indexed
      line = position.lineNumber - 1;
      ch = position.column - 1;
    } else {
      return null;
    }
    let absoluteCursor = 0;
    let sourceLines = source.split("\n");
    for (let index = 0; index < line; index++) {
      absoluteCursor += sourceLines[index].length + 1;
    }
    absoluteCursor += ch;
    return absoluteCursor;
  }
  return null;
};

const positionFromCursor = (cursor: number, source: string, editor: string) => {
  if (source) {
    let line = 0;
    let ch = 0;
    for (let index = 0; index < cursor; index++) {
      if (source[index] == "\n") {
        line++;
        ch = 0;
      } else {
        ch++;
      }
    }
    if (editor === "codemirror") {
      return { line: line, ch: ch, sticky: null };
    } else if (editor === "monaco") {
      return { lineNumber: line + 1, column: ch + 1 };
    }
  }
  return null;
};

document.addEventListener("serenade-chrome-set-codemirror-selection", (e) => {
  let codeMirror = getCodeMirror();
  if ((e as any).detail.cursorStart !== null && (e as any).detail.cursorEnd !== null) {
    let positionStart = positionFromCursor(
      (e as any).detail.cursorStart,
      codeMirror?.getValue(),
      "codemirror"
    );
    let positionEnd = positionFromCursor(
      (e as any).detail.cursorEnd,
      codeMirror?.getValue(),
      "codemirror"
    );
    codeMirror?.setSelection(positionStart, positionEnd);
  }
});

document.addEventListener("serenade-chrome-set-monaco-selection", (e) => {
  let monacoEditor = getMonaco();
  let monacoModel = monacoEditor?.getModel();
  if ((e as any).detail.cursorStart !== null && (e as any).detail.cursorEnd !== null) {
    let positionStart = positionFromCursor(
      (e as any).detail.cursorStart,
      monacoModel?.getValue(),
      "monaco"
    );
    let positionEnd = positionFromCursor(
      (e as any).detail.cursorEnd,
      monacoModel?.getValue(),
      "monaco"
    );
    monacoEditor?.setSelection({
      startLineNumber: positionStart?.lineNumber,
      startColumn: positionStart?.column,
      endLineNumber: positionEnd?.lineNumber,
      endColumn: positionEnd?.column,
    });
  }
});

document.addEventListener("serenade-chrome-set-codemirror-cursor", (e) => {
  let codeMirror = getCodeMirror();
  if ((e as any).detail.cursor !== null) {
    let position = positionFromCursor(
      (e as any).detail.cursor,
      codeMirror?.getValue(),
      "codemirror"
    );
    codeMirror?.setCursor(position);
  }
});

document.addEventListener("serenade-chrome-set-monaco-cursor", (e) => {
  let monacoEditor = getMonaco();
  let monacoModel = monacoEditor?.getModel();
  if ((e as any).detail.cursor !== null) {
    let position = positionFromCursor((e as any).detail.cursor, monacoModel?.getValue(), "monaco");
    monacoEditor?.setPosition(position);
  }
});

document.addEventListener("serenade-chrome-set-codemirror-source-and-cursor", (e) => {
  let codeMirror = getCodeMirror();
  if ((e as any).detail.source && (e as any).detail.cursor !== null) {
    codeMirror?.setValue((e as any).detail.source);
    let position = positionFromCursor(
      (e as any).detail.cursor,
      codeMirror?.getValue(),
      "codemirror"
    );
    codeMirror?.setCursor(position);
  }
});

document.addEventListener("serenade-chrome-set-monaco-source-and-cursor", (e) => {
  let monacoEditor = getMonaco();
  let monacoModel = monacoEditor?.getModel();
  if ((e as any).detail.source && (e as any).detail.cursor !== null) {
    monacoModel?.setValue((e as any).detail.source);
    let position = positionFromCursor((e as any).detail.cursor, monacoModel?.getValue(), "monaco");
    monacoEditor?.setPosition(position);
  }
});

document.addEventListener("serenade-chrome-request-codemirror", () => {
  let codeMirror = getCodeMirror();
  document.dispatchEvent(
    new CustomEvent("serenade-chrome-send-codemirror", {
      detail: {
        // codeMirror: codeMirror, // sending complex objects doesn't work because custom event data is read-only
        codeMirrorValue: codeMirror?.getValue() as string,
        codeMirrorCursor: cursorFromPosition(
          codeMirror?.getCursor(),
          codeMirror?.getValue(),
          "codemirror"
        ),
        codeMirrorFilename: codeMirror ? getFilenameFromCodeMirror(codeMirror) : null,
      },
    })
  );
});

document.addEventListener("serenade-chrome-request-monaco", () => {
  let monacoEditor = getMonaco();
  let model = monacoEditor?.getModel();
  let source = model?.getValue();
  let filename = getFilenameFromMonaco(model);
  document.dispatchEvent(
    new CustomEvent("serenade-chrome-send-monaco", {
      detail: {
        monacoValue: source,
        monacoCursor: cursorFromPosition(monacoEditor?.getPosition(), source, "monaco"),
        monacoFilename: filename,
      },
    })
  );
});
