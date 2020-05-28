import CommandHandler from "../command-handler";

/*
 * Handles commands from the client about navigation.
 */

export default class NavigationHandler {
  // These are declared by CommandHandler, which we extend
  postMessage?: (request: string, data?: any) => Promise<any>;

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
      CommandHandler.executeScript(`window.scrollBy({ ${direction}, behavior: "smooth" });`);
    }

    // Scrolling to a path
    if (data.path) {
      return this.postMessage!("findMatchAndScroll", { path: data.path });
    }
  }
}
