import IPC from "../shared/ipc";
import { start } from "repl";

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

  // Given a node, its offset from the start, and a cursorStart and cursorEnd,
  // set the cursor in the node.
  private static _trySetCursor(
    node: Node,
    startOffset: number,
    cursorStart?: number,
    cursorEnd?: number
  ) {
    let shouldBreak = false;

    // console.log(
    //   node.nodeType,
    //   (node as HTMLElement).tagName,
    //   node.textContent,
    //   startOffset,
    //   cursorStart,
    //   cursorEnd
    // );

    if (
      cursorStart !== undefined &&
      ((node.nodeType === Node.TEXT_NODE &&
        node.textContent &&
        node.textContent.length + startOffset > cursorStart) ||
        (Transformer._isManualLineBreak(node) && startOffset === cursorStart)) &&
      startOffset <= cursorStart
    ) {
      // call range to set start
      let innerOffset = cursorStart - startOffset;
      let startNode = node;
      if (window.getSelection()!.rangeCount) {
        window.getSelection()!.empty();
      }
      // console.log(
      //   "start",
      //   startNode.nodeType,
      //   startNode.textContent,
      //   innerOffset,
      //   startOffset,
      //   cursorStart
      // );
      window.getSelection()!.collapse(startNode, innerOffset);

      if (cursorEnd === undefined) {
        shouldBreak = true;
      }
    }

    if (
      cursorEnd !== undefined &&
      ((node.nodeType === Node.TEXT_NODE &&
        node.textContent &&
        node.textContent.length + startOffset >= cursorEnd) ||
        (Transformer._isManualLineBreak(node) && startOffset === cursorEnd)) &&
      startOffset <= cursorEnd
    ) {
      // call range to set end
      let innerOffset = cursorEnd - startOffset;
      // console.log("end", node.nodeType, node.textContent, innerOffset, startOffset, cursorEnd);
      window.getSelection()!.extend(node, innerOffset);

      shouldBreak = true;
    }
    return shouldBreak;
  }

  private static _isBlockElement(node: Node): boolean {
    return ["P", "DIV"].includes((node as HTMLElement).tagName);
  }

  private static _isManualLineBreak(node: Node): boolean {
    return ["BR"].includes((node as HTMLElement).tagName);
  }

  // Given a target element and optional selection range, returns the text
  // content for the parent contenteditable (anchor). If optional selection
  // range, stops returning at the start of the cursor.
  private static _getTextContent(
    target: HTMLElement | Text,
    range?: Range,
    cursorStart?: number,
    cursorEnd?: number
  ): string | null {
    const anchor = Transformer._getAnchor(target);
    if (anchor === null || !(anchor instanceof HTMLElement)) {
      return null;
    }

    const selected = range ? range.startContainer : null;

    // two consecutive block elements shouldn't have two newlines added
    let justAddedBlockNewline = true;
    let justAddedManualNewline = false;

    let shouldBreak = false;
    let shouldAddContent = false;

    let content = "";

    let lastNode = anchor.childNodes.item(anchor.childNodes.length - 1);

    // look at parent, each child, then parent (so we can add newlines properly)
    const visit = (anchor: Node) => {
      if (shouldBreak) {
        return;
      }

      for (let i = 0; i < anchor.childNodes.length; i++) {
        if (shouldBreak) {
          break;
        }

        const node = anchor.childNodes.item(i);

        let lastElement = node === lastNode;
        // or if we're the last sibling in our parent element that's the last node
        if (!lastElement) {
          let pointer: Node | null = node;
          while (pointer && pointer.nextSibling === null) {
            if (pointer.parentElement === lastNode) {
              lastElement = true;
            }
            pointer = pointer.parentElement;
          }
        }

        // console.log(
        //   node.nodeType,
        //   (node as HTMLElement).tagName,
        //   node.textContent,
        //   justAddedBlockNewline,
        //   justAddedManualNewline,
        //   content.length
        // );

        if (cursorStart !== undefined || cursorEnd !== undefined) {
          shouldBreak = Transformer._trySetCursor(node, content.length, cursorStart, cursorEnd);
          shouldAddContent = true;
        }

        if (
          Transformer._isBlockElement(node) &&
          !justAddedBlockNewline &&
          !justAddedManualNewline
        ) {
          content = content.concat("\n");
          justAddedBlockNewline = true;
        }

        if (Transformer._isManualLineBreak(node)) {
          if (!lastElement) {
            content = content.concat("\n");
            justAddedManualNewline = true;
          }
        }

        if (range && selected && node === selected) {
          content = content.concat(node.textContent!.substring(0, range.startOffset));
          shouldBreak = true;
        }

        // get contents of each child
        if (!shouldBreak) {
          visit(node);
        }

        // console.log(
        //   node.nodeType,
        //   (node as HTMLElement).tagName,
        //   node.textContent,
        //   justAddedBlockNewline,
        //   justAddedManualNewline
        // );

        if (shouldBreak && !shouldAddContent) {
          break;
        }

        if (node.nodeType === Node.ELEMENT_NODE) {
          if (Transformer._isBlockElement(node)) {
            if (!justAddedBlockNewline && !lastElement && !justAddedManualNewline) {
              content = content.concat("\n");
              justAddedBlockNewline = true;
            }
          }
        } else {
          content = content.concat(node.textContent!);
          justAddedBlockNewline = false;
          justAddedManualNewline = false;
        }

        if (shouldBreak) {
          break;
        }

        // console.log(content);
      }
    };

    visit(anchor);

    if (cursorEnd && cursorEnd > content.length) {
      let lastElement = lastNode;
      // find the last inner element in the last node
      while (lastElement && lastElement.hasChildNodes()) {
        lastElement = lastElement.lastChild!;
      }

      // console.log("end", lastElement.nodeType, lastElement.textContent, cursorEnd);
      window
        .getSelection()!
        .extend(lastElement, lastElement.textContent ? lastElement.textContent.length : 0);
    }

    return content;
  }

  static setCursor(offset: number, cursorEnd?: number) {
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

    return Transformer._getTextContent(target, undefined, offset, cursorEnd);
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
  static deleteRange(ipc: IPC, start: number, stop: number) {
    // Set the cursor to the element and offset that represents the stop,
    // and simulate (stop - start) deletes.
    Transformer.setCursor(stop);
    const deleteCount = stop - start;
    return ipc.send("simulateDelete", { deleteCount });
  }

  // Inserts text at the cursor position as seen by the user.
  static insertText(ipc: IPC, start: number, text: string) {
    // Set the cursor to the element and offset that represents the start,
    // and simulate keypresses for text.
    Transformer.setCursor(start);
    return ipc.send("insertText", { text });
  }

  // Replaces the range of text at the cursors positions as seen by the user.
  static replaceRange(ipc: IPC, start: number, stop: number, text: string) {
    Transformer.deleteRange(ipc, start, stop);
    Transformer.insertText(ipc, start, text);
  }
}
