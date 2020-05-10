import IPC from "../shared/ipc";

export default class Transformer {
  // Given a node, traverse up the tree to find a contenteditable node, if exists
  private static _getAnchor(target: HTMLElement | Text): Node | null {
    let editable;
    if (target instanceof Text) {
      editable = target.parentElement!;
    } else {
      editable = target;
    }

    while (editable) {
      if (editable.hasAttribute("contenteditable")) {
        break;
      }

      editable = editable.parentElement!;
    }

    // if we didn't find one, return an empty list
    if (!editable.hasAttribute("contenteditable")) {
      return null;
    }

    return editable;
  }

  // Given a target element and optional selection range, returns the text
  // content for the parent contenteditable (anchor). If optional selection
  // range, stops returning at the start of the cursor.
  private static _getTextContent(target: HTMLElement | Text, range?: Range): string | null {
    const anchor = Transformer._getAnchor(target);
    if (anchor === null || !(anchor instanceof HTMLElement)) {
      return null;
    }

    const selected = range ? range.startContainer : null;

    const isBlockElement = (node: Node): boolean => {
      return ["P", "DIV"].includes((node as HTMLElement).tagName);
    };

    const isManualLineBreak = (node: Node): boolean => {
      return ["BR"].includes((node as HTMLElement).tagName);
    };

    // two consecutive block elements shouldn't have two newlines added
    let justAddedManualNewline = true;

    let shouldBreak = false;

    let content = "";

    // look at parent, each child, then parent (so we can add newlines properly)
    const visit = (anchor: Node) => {
      for (let i = 0; i < anchor.childNodes.length; i++) {
        const node = anchor.childNodes.item(i);

        if (isBlockElement(node) && !justAddedManualNewline) {
          content = content.concat("\n");
        }

        if (range && selected && node === selected) {
          content = content.concat(node.textContent!.substring(0, range.startOffset));
          shouldBreak = true;
        }

        if (shouldBreak) {
          break;
        }

        // get contents of each child
        visit(node);

        if (node.nodeType === Node.ELEMENT_NODE) {
          if (isBlockElement(node) && !justAddedManualNewline) {
            content = content.concat("\n");
            justAddedManualNewline = true;
          } else if (isManualLineBreak(node)) {
            content = content.concat("\n");
          }
        } else {
          content = content.concat(node.textContent!);
          justAddedManualNewline = false;
        }
      }
    };

    visit(anchor);

    return content;
  }

  static setCursor(offset: number) {
    const selected = window.getSelection();
    if (selected === null || selected.rangeCount < 1) {
      return;
    }

    const range = selected.getRangeAt(0);
    if (range === null) {
      return;
    }

    const target = range.startContainer;
    if (!(target instanceof HTMLElement) && !(target instanceof Text)) {
      return;
    }

    const anchor = Transformer._getAnchor(target);
    if (anchor === null || !(anchor instanceof HTMLElement)) {
      return;
    }

    const isBlockElement = (node: Node): boolean => {
      return ["P", "DIV"].includes((node as HTMLElement).tagName);
    };

    const isManualLineBreak = (node: Node): boolean => {
      return ["BR"].includes((node as HTMLElement).tagName);
    };

    // two consecutive block elements shouldn't have two newlines added
    let justAddedManualNewline = true;

    let shouldBreak = false;

    let cursor = 0;

    // look at parent, each child, then parent (so we can add newlines properly)
    const visit = (anchor: Node) => {
      for (let i = 0; i < anchor.childNodes.length; i++) {
        const node = anchor.childNodes.item(i);

        if (isBlockElement(node) && !justAddedManualNewline) {
          cursor += 1; // for newline
        }

        if (
          node.nodeType === Node.TEXT_NODE &&
          node.textContent &&
          node.textContent.length + cursor >= offset
        ) {
          // call range to set
          const innerOffset = offset - cursor;
          window.getSelection()!.empty();
          window.getSelection()!.collapse(node, innerOffset);
          shouldBreak = true;
        }

        if (shouldBreak) {
          break;
        }

        // get contents of each child
        visit(node);

        if (node.nodeType === Node.ELEMENT_NODE) {
          if (isBlockElement(node) && !justAddedManualNewline) {
            cursor += 1; // for newline
            justAddedManualNewline = true;
          } else if (isManualLineBreak(node)) {
            cursor += 1; // for newline
          }
        } else {
          cursor += node.textContent!.length;
          justAddedManualNewline = false;
        }
      }
    };

    visit(anchor);

    return;
  }

  // Returns the cursor position as seen by the user.
  static getCursor(): number {
    const selected = window.getSelection();
    if (selected === null || selected.rangeCount < 1) {
      return 0;
    }

    const range = selected.getRangeAt(0);
    if (range === null) {
      return 0;
    }

    const target = range.startContainer;
    if (!(target instanceof HTMLElement) && !(target instanceof Text)) {
      return 0;
    }

    const textContent = Transformer._getTextContent(target, range);

    return textContent ? textContent.length : 0;
  }

  // Returns the source text as seen by the user. We can't use the built-in
  // textContent because it doesn't generate line breaks.
  static getSource(target: HTMLElement): string | null {
    return Transformer._getTextContent(target);
  }

  // Deletes the range of text at the cursor positions as seen by the user.
  deleteRange(ipc: IPC, start: number, stop: number) {
    // Set the cursor to the element and offset that represents the stop,
    // and simulate (stop - start) deletes.
    Transformer.setCursor(stop);
    const deleteCount = stop - start;
    return ipc.send("simulateDelete", { deleteCount });
  }

  // Inserts text at the cursor position as seen by the user.
  insertText(ipc: IPC, start: number, text: string) {
    // Set the cursor to the element and offset that represents the start,
    // and simulate keypresses for text.
    Transformer.setCursor(start);
    return ipc.send("insertText", { text });
  }

  // Replaces the range of text at the cursors positions as seen by the user.
  replaceRange(ipc: IPC, start: number, stop: number, text: string) {
    this.deleteRange(ipc, start, stop);
    this.insertText(ipc, start, text);
  }
}
