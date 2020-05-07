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

  // Goes to the root contenteditable of the target node
  // and builds a pre-order traversal of the tree
  private static _preOrderNodes(target: HTMLElement): Node[] {
    // get the parent contenteditable node that will
    // be the root of the tree search
    let editable = Transformer._getAnchor(target);

    // if we didn't find one, return an empty list
    if (editable === null) {
      return [];
    }

    // add each child first, then its children
    const addToList = (list: Node[], parent: Node) => {
      parent.childNodes.forEach((node: ChildNode) => {
        list.push(node);
        addToList(list, node);
      });
    };

    let nodes: Node[] = [];
    addToList(nodes, editable);

    return nodes;
  }

  private static _getRange(): Range | null {
    const selected = window.getSelection();
    if (selected === null || selected.rangeCount < 1) {
      return null;
    }
    return selected.getRangeAt(0);
  }

  // Returns the cursor position as seen by the user.
  static getCursor(): number {
    const range = Transformer._getRange();
    if (range === null) {
      return 0;
    }

    const target = range.startContainer;
    if (!(target instanceof HTMLElement) && !(target instanceof Text)) {
      return 0;
    }

    const anchor = Transformer._getAnchor(target);

    if (!(anchor instanceof HTMLElement)) {
      return 0;
    }

    let content = "";

    const isBlockElement = (node: Node): boolean => {
      return ["P", "DIV"].includes((node as HTMLElement).tagName);
    };

    const isManualLineBreak = (node: Node): boolean => {
      return ["BR"].includes((node as HTMLElement).tagName);
    };

    // two consecutive block elements shouldn't have two newlines added
    let justAddedManualNewline = true;

    let shouldBreak = false;

    // look at parent, each child, then parent (so we can add newlines properly)
    const visit = (anchor: Node) => {
      for (let i = 0; i < anchor.childNodes.length; i++) {
        const node = anchor.childNodes.item(i);

        if (isBlockElement(node) && !justAddedManualNewline) {
          content = content.concat("\n");
        }

        if (node === target) {
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

    return content.length;
  }

  // Returns the source text as seen by the user. We can't use the built-in
  // textContent because it doesn't generate line breaks.
  static getSource(target: HTMLElement): string | null {
    const anchor = Transformer._getAnchor(target);
    if (anchor === null || !(anchor instanceof HTMLElement)) {
      return null;
    }

    let content = "";

    const isBlockElement = (node: Node): boolean => {
      return ["P", "DIV"].includes((node as HTMLElement).tagName);
    };

    const isManualLineBreak = (node: Node): boolean => {
      return ["BR"].includes((node as HTMLElement).tagName);
    };

    // two consecutive block elements shouldn't have two newlines added
    let justAddedManualNewline = true;

    // look at parent, each child, then parent (so we can add newlines properly)
    const visit = (anchor: Node) => {
      anchor.childNodes.forEach((node: ChildNode) => {
        if (isBlockElement(node) && !justAddedManualNewline) {
          content = content.concat("\n");
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
      });
    };

    visit(anchor);

    return content;
  }

  // Deletes the range of text at the cursor positions as seen by the user.
  deleteRange(start: number, stop: number) {
    return stop - start;
  }

  // Inserts text at the cursor position as seen by the user.
  insertText(start: number, text: string) {
    return start + text;
  }

  // Replaces the range of text at the cursors positions as seen by the user.
  replaceRange(start: number, stop: number, text: string) {
    this.deleteRange(start, stop);
    this.insertText(start, text);
  }

  getCursorPosition() {
    // add children to the stack for a preorder traversal
    const addChildrenToStack = (stack: Element[], parent: Element) => {
      for (let i = parent.childNodes.length - 1; i > -1; i--) {
        if (parent.childNodes[i].nodeType === Node.ELEMENT_NODE) {
          stack.push(parent.childNodes[i] as Element);
        }
      }
    };

    const selected = window.getSelection();
    if (selected === null || selected.rangeCount < 1) {
      return 0;
    }

    const range = selected.getRangeAt(0);
    const anchor = selected.anchorNode!;

    console.log(
      "Selection:",
      anchor,
      selected.anchorOffset,
      selected.focusNode,
      selected.focusOffset
    );

    console.log(
      "Range:",
      range.startContainer,
      range.startOffset,
      range.endContainer,
      range.endOffset
    );

    // get the parent contenteditable node that will be the root of the tree search
    let editable = anchor.parentElement!;
    while (editable) {
      if (editable.hasAttribute("contenteditable")) {
        break;
      }

      editable = editable.parentElement!;
    }

    // start with the immediate children of the contenteditable
    let nodes: Element[] = [];
    addChildrenToStack(nodes, editable);

    // for content like `<span>hi</span>`, we want to include the length of the start tag,
    // but not of the end tag
    let result = 0;
    if (anchor.parentNode && anchor.parentNode !== editable) {
      result += (anchor.parentNode as HTMLElement).outerHTML.indexOf(">");
    }

    // do a pre-order DFS of the DOM starting at the editor root
    while (nodes.length > 0) {
      let node = nodes.pop();

      if (!node) {
        return result;
      }

      console.log(node.tagName, node.textContent);

      // if we found the desired text node, then just add the cursor position in that text node
      if (node === anchor) {
        console.log(result, range.startOffset);
        return result + range.startOffset;
      }

      // if we find a node like `<span>hi</span>` that doesn't match, then include the tags
      // in our offset into the string
      else if (node.childNodes.length === 1 && node.childNodes[0] !== anchor) {
        console.log(node.outerHTML.length);
        result += node.outerHTML.length;
      }

      // add the length of text nodes
      else if (node.nodeType === Node.TEXT_NODE) {
        console.log(node.textContent!.length);
        result += node.textContent!.length;
      }

      // add children to preorder traversal
      else {
        addChildrenToStack(nodes, node);
      }
    }

    return 0;
  }
}
