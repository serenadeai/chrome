const cmModes: { [key: string]: string[] } = {
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
  ],
  Kotlin: ["kotlin", "text/x-kotlin"],
  Python: ["text/x-python", "text/x-ipython", "ipython"],
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
  for (const [language, modes] of Object.entries(cmModes)) {
    if (modes.includes(mode)) {
      return "chrome." + languageExtensions[language][0];
    }
  }
  return "";
};

const cursorFromPosition = (position: any, source: string) => {
  if (source) {
    let absoluteCursor = 0;
    let sourceLines = source.split("\n");
    for (let index = 0; index < position.line; index++) {
      absoluteCursor += sourceLines[index].length + 1;
    }
    absoluteCursor += position.ch;
    return absoluteCursor;
  }
  return null;
};

const positionFromCursor = (cursor: number, source: string) => {
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
    return { line: line, ch: ch, sticky: null };
  }
  return { line: 0, ch: 0, sticky: null };
};

document.addEventListener("serenade-chrome-set-codemirror-selection", (e) => {
  let codeMirror = getCodeMirror();
  if ((e as any).detail.cursorStart !== null && (e as any).detail.cursorEnd !== null) {
    let positionStart = positionFromCursor((e as any).detail.cursorStart, codeMirror?.getValue());
    let positionEnd = positionFromCursor((e as any).detail.cursorEnd, codeMirror?.getValue());
    codeMirror?.setSelection(positionStart, positionEnd);
  }
});

document.addEventListener("serenade-chrome-set-codemirror-cursor", (e) => {
  let codeMirror = getCodeMirror();
  if ((e as any).detail.cursor !== null) {
    let position = positionFromCursor((e as any).detail.cursor, codeMirror?.getValue());
    codeMirror?.setCursor(position);
  }
});

document.addEventListener("serenade-chrome-set-codemirror-source-and-cursor", (e) => {
  let codeMirror = getCodeMirror();
  if ((e as any).detail.source && (e as any).detail.cursor !== null) {
    codeMirror?.setValue((e as any).detail.source);
    let position = positionFromCursor((e as any).detail.cursor, codeMirror?.getValue());
    codeMirror?.setCursor(position);
  }
});

document.addEventListener("serenade-chrome-request-codemirror", () => {
  let codeMirror = getCodeMirror();
  document.dispatchEvent(
    new CustomEvent("serenade-chrome-send-codemirror", {
      detail: {
        // codeMirror: codeMirror, // sending complex objects doesn't work because custom event data is read-only
        codeMirrorValue: codeMirror?.getValue() as string,
        codeMirrorCursor: cursorFromPosition(codeMirror?.getCursor(), codeMirror?.getValue()),
        codeMirrorFilename: codeMirror ? getFilenameFromCodeMirror(codeMirror) : null,
      },
    })
  );
});
