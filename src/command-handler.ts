enum OverlayType {
  None = "NONE",
  Links = "LINKS",
  Inputs = "INPUTS",
}

export default class CommandHandler {
  private overlayPath: string = "";
  private overlayType: OverlayType = OverlayType.None;

  private clearOverlays() {
    const code = `
(function() {
  var overlays = document.getElementsByClassName("serenade-overlay");
  while (overlays[0]) {
    overlays[0].parentNode.removeChild(overlays[0]);
  }
})();
    `;

    chrome.tabs.executeScript({ code });
    this.overlayPath = "";
    this.overlayType = OverlayType.None;
  }

  private nodesMatching(path?: string) {
    return path
      ? `(function() { var snapshot = document.evaluate(".//*[not(self::script)][not(self::noscript)][not(self::title)][not(self::meta)][not(self::svg)][not(self::img)][not(self::style)][text()[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${path}')]]", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null); var result = []; for (var i = 0; i < snapshot.snapshotLength; i++) { result.push(snapshot.snapshotItem(i)); } return result; })()`
      : `(function() { var elements = document.querySelectorAll("${this.overlayType}" == "LINKS" ? "a, button" : "input, textarea, div[contenteditable]"); var result = []; for (var i = 0; i < elements.length; i++) { if ("${this.overlayType}" != "LINKS" || !/^\s*$/.test(elements[i].innerHTML)) { result.push(elements[i]); } } return result; })()`;
  }

  private static executeScript(code: string, callback?: (data: any) => void) {
    if (callback) {
      chrome.tabs.executeScript({ code }, (data) => callback(data));
    } else {
      chrome.tabs.executeScript({ code });
    }
  }

  /* Editor state */

  async COMMAND_TYPE_GET_EDITOR_STATE(_data: any): Promise<any> {
    const codeForSource = `
document.activeElement ? (
  document.activeElement.tagName == 'INPUT' ? document.activeElement.value : ""
) : ""`;
    const codeForCursor = `
document.activeElement ? (
  document.activeElement.tagName == 'INPUT' ? document.activeElement.selectionStart : 0
) : 0`;

    return new Promise((resolve) => {
      CommandHandler.executeScript(codeForSource, (source) => {
        CommandHandler.executeScript(codeForCursor, (cursor) => {
          resolve({
            message: "editorState",
            data: {
              source: source[0],
              cursor: cursor[0],
              filename: "",
              files: [],
              roots: [],
            },
          });
        });
      });
    });
  }

  async COMMAND_TYPE_DIFF(data: any): Promise<any> {
    const codeForActive = `document.activeElement && document.activeElement.tagName`;
    const codeForInput = `document.activeElement.value = \`${data.source}\`; document.activeElement.setSelectionRange(${data.cursor}, ${data.cursor});`;

    return new Promise((resolve) => {
      CommandHandler.executeScript(codeForActive, (active) => {
        if (active[0] === "INPUT") {
          CommandHandler.executeScript(codeForInput, (_result) => {
            resolve(null);
          });
        } else {
          resolve(null);
        }
      });
    });
  }

  /* Navigation */

  async COMMAND_TYPE_BACK(_data: any): Promise<any> {
    CommandHandler.executeScript("window.history.back();");
  }

  async COMMAND_TYPE_FORWARD(_data: any): Promise<any> {
    CommandHandler.executeScript("window.history.forward();");
  }

  async COMMAND_TYPE_RELOAD(_data: any): Promise<any> {
    chrome.tabs.reload();
  }

  async COMMAND_TYPE_SCROLL(data: any): Promise<any> {
    let direction;
    switch (data.direction) {
      case "left":
        direction = `left: -window.innerWidth * 0.8`;
        break;
      case "right":
        direction = `left: window.innerWidth * 0.8`;
        break;
      case "up":
        direction = `top: -window.innerWidth * 0.8`;
        break;
      case "down":
        direction = `top: window.innerWidth * 0.8`;
        break;
    }
    if (direction) {
      CommandHandler.executeScript(
        `window.scrollBy({ ${direction}, behavior: "smooth" });`
      );
    }
  }

  /* Tab management */

  async COMMAND_TYPE_CREATE_TAB(_data: any): Promise<any> {
    chrome.tabs.create({});
  }

  async COMMAND_TYPE_CLOSE_TAB(_data: any): Promise<any> {
    chrome.tabs.query({ currentWindow: true, active: true }, (current) => {
      if (!current || current.length === 0) {
        return;
      }

      chrome.tabs.remove(current[0].id!);
    });
  }

  async COMMAND_TYPE_NEXT_TAB(_data: any): Promise<any> {
    chrome.tabs.query({ currentWindow: true, active: true }, (current) => {
      if (!current || current.length === 0) {
        return;
      }

      chrome.tabs.query(
        { currentWindow: true, index: current[0].index + 1 },
        (tab) => {
          if (!tab || tab.length === 0) {
            return;
          }

          chrome.tabs.update(tab[0].id!, { active: true }, (_v: any) => {});
        }
      );
    });
  }

  async COMMAND_TYPE_PREVIOUS_TAB(_data: any): Promise<any> {
    chrome.tabs.query({ currentWindow: true, active: true }, (current) => {
      if (!current || current.length === 0) {
        return;
      }

      chrome.tabs.query(
        { currentWindow: true, index: current[0].index - 1 },
        (tab) => {
          if (!tab || tab.length === 0) {
            return;
          }

          chrome.tabs.update(tab[0].id!, { active: true }, (_v: any) => {});
        }
      );
    });
  }

  async COMMAND_TYPE_SWITCH_TAB(data: any): Promise<any> {
    chrome.tabs.query({ currentWindow: true, index: data.index - 1 }, (tab) => {
      chrome.tabs.update(tab[0].id!, { active: true }, (_v: any) => {});
    });
  }

  /* Actions */

  async COMMAND_TYPE_SHOW(data: any): Promise<any> {
    this.clearOverlays();
    this.overlayPath = data.path;
    this.overlayType = OverlayType.Links;
    if (data.text === "inputs") {
      this.overlayType = OverlayType.Inputs;
    }

    const code = `
(function() {
  var counter = 1;
  var bodyRect = document.body.getBoundingClientRect();
  var elements = ${this.nodesMatching(data.path)};
  for (var i = 0; i < elements.length; i++) {
    var elementRect = elements[i].getBoundingClientRect();
    var overlay = document.createElement("div");
    overlay.innerHTML = counter;
    overlay.className = "serenade-overlay";
    overlay.style.position = "absolute";
    overlay.style.zIndex = 999;
    overlay.style.top = (elementRect.top - bodyRect.top) + "px";
    overlay.style.left = (elementRect.left - bodyRect.left) + "px";
    overlay.style.padding = "3px";
    overlay.style.textAlign = "center";
    overlay.style.color = "#e6ecf2";
    overlay.style.background = "#1c1c16";
    overlay.style.borderRadius = "3px";
    overlay.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif';

    document.body.appendChild(overlay);
    counter++;
  }
})();
    `;

    chrome.tabs.executeScript({ code });
  }

  async COMMAND_TYPE_CLICK(data: any): Promise<any> {
    const code =
      this.overlayType !== OverlayType.None
        ? `${this.nodesMatching(this.overlayPath)}[${data.path} - 1].${
            this.overlayType === OverlayType.Links ? "click" : "focus"
          }();`
        : `${this.nodesMatching(data.path)}[0].click();`;

    chrome.tabs.executeScript({ code });
    this.clearOverlays();
  }

  async COMMAND_TYPE_CLICKABLE(data: any): Promise<any> {
    if (this.overlayType !== OverlayType.None) {
      return {
        message: "clickable",
        data: {
          clickable: /^\d+$/.test(data.path),
        },
      };
    }

    return new Promise((resolve) => {
      CommandHandler.executeScript(
        `${this.nodesMatching(data.path)}.length > 0;`,
        (result) => {
          resolve({
            message: "clickable",
            data: {
              clickable: result[0],
            },
          });
        }
      );
    });
  }

  async COMMAND_TYPE_CANCEL(_data: any): Promise<any> {
    this.clearOverlays();
  }
}
