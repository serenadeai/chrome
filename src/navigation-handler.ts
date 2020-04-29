import CommandHandler from "./command-handler";

/*
 * Handles commands from the client about navigation.
 */

export default class NavigationHandler {
  private static nodesMatching(path: string) {
    return `
      (function() { 
        var snapshot = document.evaluate(".//*[not(self::script)][not(self::noscript)][not(self::title)][not(self::meta)][not(self::svg)][not(self::img)][not(self::style)][text()[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${path}')]]", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        var result = [];
        for (var i = 0; i < snapshot.snapshotLength; i++) { 
          result.push(snapshot.snapshotItem(i)); 
        }
        return result; 
      })()
    `;
  }

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
    // Scrolling in a direction
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

    // Scrolling to a path
    if (data.path) {
      CommandHandler.executeScript(
        `
          ${NavigationHandler.nodesMatching(data.path)}[0].scrollIntoView({
            block: "start", inline: "nearest", behavior: "smooth"
          });
        `
      );
    }
  }
}
