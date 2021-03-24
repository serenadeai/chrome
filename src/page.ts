const getCodeMirror = () => {
  const codeMirrorNodes = (document.querySelectorAll(".CodeMirror"));
  let activeCodeMirrorNode: Node | null = null;
  codeMirrorNodes.forEach(node => {
    if (node.contains(document.activeElement)) {
      activeCodeMirrorNode = node;
    }
  });
  return (activeCodeMirrorNode as any)?.CodeMirror;
}

const cursorFromPosition = (position: CodeMirror.Position, source: string) => {
  if (source) {
    let absoluteCursor = 0;
    let sourceLines = source.split("\n");
    for (let index = 0; index < position.line; index++) {
      absoluteCursor += sourceLines[index].length;
    }
    absoluteCursor += position.ch;
    return absoluteCursor;
  }
  return null;
}

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
}

document.addEventListener("serenade-chrome-set-codemirror-selection",
  (e) => {
    let codeMirror = getCodeMirror();
    if ((e as any).detail.cursorStart !== null && (e as any).detail.cursorEnd !== null) {
      let positionStart = positionFromCursor((e as any).detail.cursorStart, codeMirror?.getValue());
      let positionEnd = positionFromCursor((e as any).detail.cursorEnd, codeMirror?.getValue());
      codeMirror?.setSelection(positionStart, positionEnd);
    }
  });

document.addEventListener("serenade-chrome-set-codemirror-cursor",
  (e) => {
    let codeMirror = getCodeMirror();
    if ((e as any).detail.cursor !== null) {
      let position = positionFromCursor((e as any).detail.cursor, codeMirror?.getValue());
      codeMirror?.setCursor(position);
    }
  });

document.addEventListener("serenade-chrome-set-codemirror-source-and-cursor",
  (e) => {
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
      },
    })
  );
});
