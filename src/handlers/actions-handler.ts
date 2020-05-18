import CommandHandler from "../command-handler";

/*
 * Handles commands from the client about actions, like clicks.
 */

enum OverlayType {
  None = "NONE",
  Links = "LINKS",
  Inputs = "INPUTS",
}

export default class ActionsHandler {
  private overlayPath: string = "";
  private overlayType: OverlayType = OverlayType.None;

  private clearOverlays() {
    const clearOverlays = () => {
      const overlays = document.getElementsByClassName("serenade-overlay");
      while (overlays[0]) {
        overlays[0].parentNode!.removeChild(overlays[0]);
      }
    };

    CommandHandler.executeFunction(clearOverlays);
    this.overlayPath = "";
    this.overlayType = OverlayType.None;
  }

  private nodesMatching(path?: string) {
    return path
      ? `(function() { var snapshot = document.evaluate(".//*[not(self::script)][not(self::noscript)][not(self::title)][not(self::meta)][not(self::svg)][not(self::img)][not(self::style)][text()[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${path}')]]", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null); var result = []; for (var i = 0; i < snapshot.snapshotLength; i++) { result.push(snapshot.snapshotItem(i)); } return result; })()`
      : `(function() { var elements = document.querySelectorAll("${this.overlayType}" == "LINKS" ? "a, button" : "input, textarea, div[contenteditable]"); var result = []; for (var i = 0; i < elements.length; i++) { if ("${this.overlayType}" != "LINKS" || !/^\s*$/.test(elements[i].innerHTML)) { result.push(elements[i]); } } return result; })()`;
  }

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
          overlay.style.border = "1px solid #e6ecf2";
          overlay.style.borderRadius = "3px";
          overlay.style.opacity = "0.8";
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
      CommandHandler.executeScript(`${this.nodesMatching(data.path)}.length > 0;`, (result) => {
        resolve({
          message: "clickable",
          data: {
            clickable: result[0],
          },
        });
      });
    });
  }

  async COMMAND_TYPE_CANCEL(_data: any): Promise<any> {
    this.clearOverlays();
  }
}
