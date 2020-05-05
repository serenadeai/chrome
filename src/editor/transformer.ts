export default class Transformer {
  // Returns the cursor position as seen by the user.
  static getCursor(target: Node) {
    const selected = window.getSelection();
    if (selected === null || selected.rangeCount < 1) {
      return 0;
    }

    const range = selected.getRangeAt(0);
    const anchor = range.startContainer;

    // get the parent contenteditable node that will be the root of the tree search
    let editable = anchor.parentElement!;
    while (editable) {
      if (editable.hasAttribute("contenteditable")) {
        break;
      }

      editable = editable.parentElement!;
    }

    const addChildrenToStack = (stack: Node[], parent: Node) => {
      for (let i = parent.childNodes.length - 1; i > -1; i--) {
        stack.push(parent.childNodes[i]);
        addChildrenToStack(stack, parent.childNodes[i]);
      }
    };

    let nodes: Element[] = [];
    addChildrenToStack(nodes, editable);

    // add the length of the text content
    let result = 0;

    // do a pre-order DFS of the DOM starting at the editor root
    while (nodes.length > 0) {
      let node = nodes.pop();

      for (let node of nodes) {
        console.log(node.nodeType, node.textContent);
      }

      if (!node) {
        return result;
      }
      console.log("Looking at: ", node.textContent, node.nodeType, result);

      // if we found the desired text node, then just add the cursor position in that text node
      if (node.parentElement === anchor) {
        console.log("found", node.nodeType, result, range.startOffset);
        return result + range.startOffset;
      }

      // if we find a node that's a special node, add a line break
      else if (
        node.nodeType === Node.ELEMENT_NODE &&
        ["P", "BR", "DIV"].includes((node as HTMLElement).tagName)
      ) {
        result += 1;
        console.log("newline", node.nodeType, result, range.startOffset);
      }

      // add the length of text nodes
      else if (node.nodeType === Node.TEXT_NODE) {
        result += node.textContent!.length;
        console.log("text", node.nodeType, result, range.startOffset);
      }
    }

    return 0;

    // Generic DFS to traverse the node. We do this manually so we can add a line break
    // for certain tags: P, BR, DIV.
    const visit = (node: Node, cursor: number) => {
      console.log(node, node.nodeType, node.textContent, cursor);
      // If we're at our selected node, return the offset
      if (node === range.startContainer) {
        console.log("matched");
        return cursor + range.startOffset;
      }
      // If we have children, visit them:
      else if (node.hasChildNodes()) {
        let children = node.childNodes;

        for (let i = 0; i < children.length; i++) {
          cursor = visit(children[i], cursor);
        }

        // After visiting our children, add a line break if we're a tag that should
        // have one visually.
        if (
          node.nodeType === Node.ELEMENT_NODE &&
          ["P", "BR", "DIV"].includes((node as HTMLElement).tagName) &&
          node !== target // exclude anchor node
        ) {
          cursor += 1;
        }
      } else {
        cursor += node.textContent!.length;
      }
      return cursor;
    };

    return visit(target, 0);
  }

  // Returns the source text as seen by the user.
  static getSource(target: Node) {
    // Generic DFS to print the node. We do this manually so we can add a line break
    // for certain tags: P, BR, DIV.
    const visit = (node: Node, content: string) => {
      // If we have children, visit them:
      if (node.hasChildNodes()) {
        let children = node.childNodes;

        for (let i = 0; i < children.length; i++) {
          content = visit(children[i], content);
        }

        // After visiting our children, add a line break if we're a tag that should
        // have one visually.
        if (
          node.nodeType === Node.ELEMENT_NODE &&
          ["P", "BR", "DIV"].includes((node as HTMLElement).tagName) &&
          node !== target // exclude anchor node
        ) {
          content = content.concat("\n");
        }
      } else {
        content = content.concat(node.textContent!);
      }
      return content;
    };

    return visit(target, "");
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
