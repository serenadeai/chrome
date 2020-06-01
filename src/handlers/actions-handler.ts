/*
 * Handles commands from the client about actions, like clicks.
 */

export default class ActionsHandler {
  // These are declared by CommandHandler, which we extend
  postMessage?: (request: string, data?: any) => Promise<any>;

  private async clearOverlays() {
    await this.postMessage!("clearOverlays");
  }

  async COMMAND_TYPE_SHOW(data: any): Promise<any> {
    await this.clearOverlays();

    await this.postMessage!("showOverlay", {
      path: data.path,
      overlayType: data.text,
    });
  }

  async COMMAND_TYPE_CLICK(data: any): Promise<any> {
    await this.postMessage!("click", {
      path: data.path,
    });
  }

  async COMMAND_TYPE_CLICKABLE(data: any): Promise<any> {
    return new Promise((resolve) => {
      this.postMessage!("findClickable", {
        path: data.path,
      }).then((data) => {
        resolve({
          message: "clickable",
          data,
        });
      });
    });
  }

  async COMMAND_TYPE_CANCEL(_data: any): Promise<any> {
    await this.clearOverlays();
  }
}
