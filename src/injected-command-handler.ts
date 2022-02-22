import * as editors from "./editors";

export default class InjectedCommandHandler {
  private overlays: { node: Node; type: string }[] = [];
  private settings = {
    alwaysShowClickables: false,
  };

  private clickNode(node: Node) {
    const element = node as HTMLElement;
    if (element.className!.includes("CodeMirror")) {
      element.getElementsByTagName("textarea")[0].focus();
      element.getElementsByTagName("textarea")[0].click();
    } else {
      element.focus();
      element.click();
    }
  }

  private async copyCode(node: Node) {
    const element = node as HTMLElement;
    const text = element.innerText;
    await navigator.clipboard.writeText(text);
  }

  private clearOverlays() {
    let overlays = document.querySelectorAll("[id^=serenade-overlay]");
    overlays.forEach((overlay) => {
      overlay!.remove();
    });
    this.overlays = [];
  }

  private inViewport(element: HTMLElement) {
    const bounding = element.getBoundingClientRect();

    // Check that this is in the viewport and has some dimensions
    return (
      ((bounding.top >= 0 && bounding.top <= window.innerHeight) ||
        (bounding.bottom >= 0 && bounding.bottom <= window.innerHeight)) &&
      ((bounding.left >= 0 && bounding.left <= window.innerWidth) ||
        (bounding.right >= 0 && bounding.right <= window.innerWidth)) &&
      !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length)
    );
  }

  private nodesMatchingPath(path: string) {
    let matches = [];
    const snapshot = document.evaluate(
      `.//*[not(self::script)][not(self::noscript)][not(self::title)][not(self::meta)][not(self::svg)][not(self::style)]
      [contains(translate(text(),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'), "${path}")]|
      //input[contains(translate(@placeholder, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), "${path}")]|
      //img[contains(translate(@alt, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), "${path}")]`,
      document,
      null,
      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      null
    );

    const re = new RegExp(
      path
        // See https://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript/3561711#3561711
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        .split(" ")
        .join("\\s*\\b"),
      "i"
    );

    for (let i = 0; i < snapshot.snapshotLength; i++) {
      const item = snapshot.snapshotItem(i);
      if (
        item !== null &&
        this.inViewport(item as HTMLElement) &&
        (item as HTMLElement).innerText.match(re)
      ) {
        matches.push(item);
      }
    }

    return matches;
  }

  private nodesMatchingSelector(selector: string) {
    let matches = [];
    const nodes = document.querySelectorAll(selector);
    for (let i = 0; i < nodes.length; i++) {
      const item = nodes[i];
      if (item !== null && this.inViewport(item as HTMLElement)) {
        matches.push(item);
      } else {
        console.log(item);
      }
    }
    return matches;
  }

  private elementIsScrollable(element: HTMLElement, direction: string): boolean {
    if (
      direction === "up" ||
      direction === "down" ||
      direction === "bottom" ||
      direction === "top"
    ) {
      const overflowStyle = window.getComputedStyle(element).overflowY;
      return (
        element.scrollHeight > element.clientHeight &&
        (overflowStyle === "scroll" || overflowStyle === "auto")
      );
    } else if (direction === "left" || direction === "right") {
      const overflowStyle = window.getComputedStyle(element).overflowX;
      return (
        element.scrollWidth > element.clientWidth &&
        (overflowStyle === "scroll" || overflowStyle === "auto")
      );
    }
    return false;
  }

  private scrollOptions(element: HTMLElement | Window, direction: string) {
    let dir = {};
    if ("clientWidth" in element) {
      // Element type
      switch (direction) {
        case "left":
          dir = { left: -element.clientWidth * 0.6 };
          break;
        case "right":
          dir = { left: element.clientWidth * 0.6 };
          break;
        case "up":
          dir = { top: -element.clientHeight * 0.6 };
          break;
        case "down":
          dir = { top: element.clientHeight * 0.6 };
          break;
        case "bottom":
          dir = { top: element.scrollHeight };
          break;
        case "top":
          dir = { top: 0 };
          break;
      }
    } else {
      // Window type
      switch (direction) {
        case "left":
          dir = { left: -element.innerWidth * 0.8 };
          break;
        case "right":
          dir = { left: element.innerWidth * 0.8 };
          break;
        case "up":
          dir = { top: -element.innerHeight * 0.8 };
          break;
        case "down":
          dir = { top: element.innerHeight * 0.8 };
          break;
        case "bottom":
          dir = { top: document.body.scrollHeight };
          break;
        case "top":
          dir = { top: 0 };
          break;
      }
    }
    let options = Object.assign(dir, { behavior: "smooth" }) as ScrollOptions;
    return options;
  }

  private async scrollInDirection(direction: string) {
    let hoveredElements = document.querySelectorAll("*:hover");
    let lastHoveredElement = hoveredElements.length
      ? (hoveredElements[hoveredElements.length - 1] as HTMLElement)
      : null;
    let scrolled = false;
    while (lastHoveredElement && !scrolled) {
      if (this.elementIsScrollable(lastHoveredElement, direction)) {
        let options = this.scrollOptions(lastHoveredElement, direction);
        if (direction === "top" || direction === "bottom") {
          lastHoveredElement.scrollTo(options);
        } else {
          lastHoveredElement.scrollBy(options);
        }
        scrolled = true;
      } else {
        lastHoveredElement = lastHoveredElement.parentElement;
      }
    }
    if (!scrolled) {
      let options = this.scrollOptions(window, direction);
      if (direction === "top" || direction === "bottom") {
        window.scrollTo(options);
      } else {
        window.scrollBy(options);
      }
    }
    await new Promise((resolve) => {
      setTimeout(resolve, 300);
    });
  }

  private findAndScroll(path: string) {
    const matches = this.nodesMatchingPath(path);
    if (matches.length <= 0) {
      return;
    }
    // Look for first match below/to the right of window
    let target = matches.find((node) => {
      const bounding = (node as Element).getBoundingClientRect();
      return bounding.top >= window.innerHeight || bounding.left >= window.innerWidth;
    });
    // Look for the first match above/to the left of window
    if (!target) {
      target = matches.find((node) => {
        const bounding = (node as Element).getBoundingClientRect();
        return bounding.top < 0 || bounding.left < 0;
      });
    }
    // Use first match
    if (!target) {
      target = matches[0];
    }

    const style = window.getComputedStyle(target as Element);
    const backgroundColor = style.getPropertyValue("background-color");
    (target as HTMLElement).style.backgroundColor = "yellow";
    (target as HTMLElement).style.transition = "background-color 0.5s";
    (target as Element).scrollIntoView({
      block: "center",
      inline: "center",
      behavior: "smooth",
    });
    window.setTimeout(() => {
      (target as HTMLElement).style.backgroundColor = backgroundColor;
    }, 2000);
  }

  private showCopyOverlay(index: number) {
    const overlay = document.createElement("div");
    overlay.innerHTML = `Copied ${index}`;
    overlay.id = "serenade-copy-overlay";
    overlay.style.position = "absolute";
    overlay.style.zIndex = "999";
    overlay.style.top = "50%";
    overlay.style.left = "50%";
    overlay.style.padding = "3px";
    overlay.style.textAlign = "center";
    overlay.style.color = "#e6ecf2";
    overlay.style.background = "#1c1c16";
    overlay.style.borderRadius = "3px";
    overlay.style.fontFamily =
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif';
    document.body.appendChild(overlay);
    setTimeout(() => {
      document.body.removeChild(overlay);
    }, 1000);
  }

  private showOverlays(nodes: Node[], overlayType: string) {
    if (this.overlays.length > 0) {
      this.clearOverlays();
    }
    const bodyRect = document.body.getBoundingClientRect();
    for (let i = 0; i < nodes.length; i++) {
      let element = nodes[i] as HTMLElement;
      const elementRect = element.getBoundingClientRect();
      const overlay = document.createElement("div");
      overlay.innerHTML = `${i + 1}`;
      overlay.id = `serenade-overlay-${i + 1}`;
      overlay.style.position = "absolute";
      overlay.style.zIndex = "999";
      overlay.style.top = elementRect.top - bodyRect.top + "px";
      overlay.style.left = elementRect.left - bodyRect.left - overlay.clientWidth + "px";
      overlay.style.padding = "3px";
      overlay.style.textAlign = "center";
      overlay.style.color = "#e6ecf2";
      overlay.style.background = "#1c1c16";
      overlay.style.borderRadius = "3px";
      overlay.style.fontFamily =
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif';
      document.body.appendChild(overlay);
      this.overlays.push({ node: nodes[i], type: overlayType });
    }
  }

  async COMMAND_TYPE_CANCEL(_data: any): Promise<any> {
    this.clearOverlays();
  }

  async COMMAND_TYPE_CLICK(data: any): Promise<any> {
    const pathNumber = parseInt(data.path, 10);
    if (this.overlays.length === 0 || isNaN(pathNumber)) {
      // if no overlays are currently shown or the path provided is not a number
      this.clearOverlays();
      let matches = this.nodesMatchingPath(data.path);
      if (matches.length <= 0) {
        return;
      } else if (matches.length === 1) {
        // auto-execute
        this.clickNode(matches[0]);
      } else {
        this.showOverlays(matches, "links");
      }
    } else {
      // overlays are shown and path is a number
      if (pathNumber - 1 >= 0 && pathNumber - 1 < this.overlays.length) {
        this.clickNode(this.overlays[pathNumber - 1].node);
      }
      this.clearOverlays();
    }
  }

  async COMMAND_TYPE_CLICKABLE(data: any): Promise<any> {
    let response: any = {
      clickable: false,
    };
    if (this.overlays.length === 0) {
      return response;
    }
    const pathNumber = parseInt(data.path, 10);
    if (!isNaN(pathNumber)) {
      // if path is a number, check that it is available
      response.clickable = pathNumber - 1 >= 0 && pathNumber - 1 < this.overlays.length;
    } else {
      // otherwise, search for matching nodes
      let matches = this.nodesMatchingPath(data.path);
      if (matches.length >= 1) {
        response.clickable = true;
      }
    }
    return response;
  }

  async COMMAND_TYPE_DIFF(data: any): Promise<any> {
    const editor = await editors.active();
    if (!editor) {
      return;
    }
    await editor.setSourceAndCursor(data.source, data.cursor);
  }

  async COMMAND_TYPE_DOM_BLUR(data: any): Promise<any> {
    const element = document.querySelector(data.text) as HTMLElement;
    if (element !== null) {
      element.blur();
    }
  }

  async COMMAND_TYPE_DOM_CLICK(data: any): Promise<any> {
    const node = document.querySelector(data.text);
    if (node) {
      this.clickNode(node);
    }
  }

  async COMMAND_TYPE_DOM_COPY(data: any): Promise<any> {
    const element = document.querySelector(data.text) as HTMLElement;
    if (element && window.getSelection) {
      let selection = window.getSelection();
      let range = document.createRange();
      range.selectNodeContents(element);
      selection?.removeAllRanges();
      selection?.addRange(range);
      await navigator.clipboard.writeText(selection?.toString() || "");
      selection?.removeAllRanges();
    }
  }

  async COMMAND_TYPE_DOM_FOCUS(data: any): Promise<any> {
    const element = document.querySelector(data.text) as HTMLElement;
    if (element) {
      element.focus();
    }
  }

  async COMMAND_TYPE_DOM_SCROLL(data: any): Promise<any> {
    const element = document.querySelector(data.text) as HTMLElement;
    if (element) {
      element.scrollIntoView({
        block: "center",
        inline: "center",
        behavior: "smooth",
      });
    }
  }

  async COMMAND_TYPE_GET_EDITOR_STATE(_data: any): Promise<any> {
    console.log(this.settings);
    if (this.settings.alwaysShowClickables) {
      console.log(this.overlays);
      this.COMMAND_TYPE_SHOW({ text: "all" });
    }
    const editor = await editors.active();
    if (!editor) {
      return;
    }
    return editor.getEditorState();
  }

  async COMMAND_TYPE_REDO(_data: any): Promise<any> {
    const editor = await editors.active();
    editor?.redo();
  }

  async COMMAND_TYPE_SCROLL(data: any): Promise<any> {
    if (data.direction || data.path === "top" || data.path === "bottom") {
      return this.scrollInDirection(data.direction);
    } else {
      return this.findAndScroll(data.path);
    }
  }

  async COMMAND_TYPE_SELECT(data: any): Promise<any> {
    const editor = await editors.active();
    if (!editor) {
      return;
    }

    return editor.setSelection(data.cursor, data.cursorEnd);
  }

  async COMMAND_TYPE_SHOW(data: any): Promise<any> {
    console.log(data)
    let selector = "";
    if (data.text == "links") {
      selector = 'a, button, summary, [role="link"], [role="button"]';
    } else if (data.text == "inputs") {
      selector = 'input, textarea, [role="checkbox"], [role="radio"]';
    } else if (data.text == "code") {
      selector = "pre, code";
    } else if (data.text == "all") {
      selector = 'a, button, summary, [role="link"], [role="button"], input, textarea, [role="checkbox"], [role="radio"]';
    } else {
      return;
    }
    console.log(selector);
    const nodes = this.nodesMatchingSelector(selector);
    console.log(nodes);
    this.showOverlays(Array.from(nodes), data.text);
  }

  async COMMAND_TYPE_UNDO(_data: any): Promise<any> {
    const editor = await editors.active();
    editor?.undo();
  }

  async COMMAND_TYPE_USE(data: any): Promise<any> {
    let overlay = this.overlays[data.index - 1];
    if (overlay.type === "links" || overlay.type === "inputs" || overlay.type === "all") {
      this.clickNode(overlay.node);
    } else if (overlay.type === "code") {
      await this.copyCode(overlay.node);
      this.showCopyOverlay(data.index);
    }
    this.clearOverlays();
  }

  async updateSettings(data: any): Promise<void> {
    this.settings = {
      alwaysShowClickables: data.alwaysShowClickables,
    };
    if (!this.settings.alwaysShowClickables) {
      this.clearOverlays();
    }
  }
}
