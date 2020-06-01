/*
 * Handles commands from the client about navigation.
 */

export default class NavigationHandler {
  // These are declared by CommandHandler, which we extend
  postMessage?: (request: string, data?: any) => Promise<any>;

  async COMMAND_TYPE_BACK(_data: any): Promise<any> {
    return this.postMessage!("navigateBack");
  }

  async COMMAND_TYPE_FORWARD(_data: any): Promise<any> {
    return this.postMessage!("navigateForward");
  }

  async COMMAND_TYPE_RELOAD(_data: any): Promise<any> {
    chrome.tabs.reload();
  }

  async COMMAND_TYPE_SCROLL(data: any): Promise<any> {
    // Scrolling in a direction
    if (data.direction) {
      return this.postMessage!("scrollDirection", { direction: data.direction });
    }

    // Scrolling to a path
    if (data.path) {
      return this.postMessage!("findMatchAndScroll", { path: data.path });
    }
  }
}
