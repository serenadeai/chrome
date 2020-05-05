export default class Transformer {
  private node: Node;

  constructor(node: Node) {
    this.node = node;
  }

  getNodeInnerText() {
    return (this.node as HTMLElement).innerHTML;
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

    const selected = document.getSelection();
    if (selected === null || selected.rangeCount < 1) {
      return 0;
    }

    console.log(selected);

    const range = selected.getRangeAt(0);
    const anchor = selected.anchorNode!;

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

      // if we found the desired text node, then just add the cursor position in that text node
      if (node === anchor) {
        return result + range.startOffset;
      }

      // if we find a node like `<span>hi</span>` that doesn't match, then include the tags
      // in our offset into the string
      else if (node.childNodes.length === 1 && node.childNodes[0] !== anchor) {
        result += node.outerHTML.length;
      }

      // add the length of text nodes
      else if (node.nodeType === Node.TEXT_NODE) {
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
