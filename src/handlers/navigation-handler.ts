/*
 * Handles commands from the client about navigation.
 */

export default class NavigationHandler {
  // These are declared by CommandHandler, which we extend
  postMessage?: (request: string, data?: any) => Promise<any>;
  resolvePostMessage?: (request: string, data?: any) => Promise<any>;

  async COMMAND_TYPE_BACK(_data: any): Promise<any> {
    return this.resolvePostMessage!("navigateBack");
  }

  async COMMAND_TYPE_FORWARD(_data: any): Promise<any> {
    return this.resolvePostMessage!("navigateForward");
  }

  async COMMAND_TYPE_RELOAD(_data: any): Promise<any> {
    chrome.tabs.reload();
  }

  async COMMAND_TYPE_SCROLL(data: any): Promise<any> {
    // Scrolling in a direction
    if (data.direction) {
      return this.resolvePostMessage!("scrollDirection", { direction: data.direction });
    }

    // Scrolling to a path
    if (data.path) {
      if (data.path == "top") {
        return this.resolvePostMessage!("scrollToTop", {});
      } else if (data.path == "bottom") {
        return this.resolvePostMessage!("scrollToBottom", {});
      } else {
        return this.resolvePostMessage!("findMatchAndScroll", { path: data.path });
      }
    }
  }
}
