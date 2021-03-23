document.addEventListener("serenade-chrome-request-codemirror", () => {
  const codeMirror = (document.querySelector(".CodeMirror") as any)?.CodeMirror;

  document.dispatchEvent(
    new CustomEvent("serenade-chrome-send-codemirror", {
      detail: {
        // codeMirror: codeMirror, // sending complex objects don't seem to work?
        codeMirrorValue: codeMirror?.doc.getValue() as string,
        codeMirrorCursor: codeMirror?.doc.getCursor(),
      },
    })
  );
});
