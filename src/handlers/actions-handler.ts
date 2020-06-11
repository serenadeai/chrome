/*
 * Handles commands from the client about actions, like clicks.
 */

export default class ActionsHandler {
  // These are declared by CommandHandler, which we extend
  postMessage?: (request: string, data?: any) => Promise<any>;

  private clearOverlays(): Promise<any> {
    return this.postMessage!("clearOverlays");
  }

  async COMMAND_TYPE_SHOW(data: any): Promise<any> {
    await this.clearOverlays();

    return this.postMessage!("showOverlay", {
      path: data.path,
      overlayType: data.text,
    });
  }

  COMMAND_TYPE_CLICK(data: any): Promise<any> {
    return this.postMessage!("click", {
      path: data.path,
    });
  }

  COMMAND_TYPE_CLICKABLE(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.postMessage!("findClickable", {
        path: data.path,
      })
        .then((data) => {
          resolve({
            message: "clickable",
            data,
          });
        })
        .catch(() => {
          reject();
        });
    });
  }

  COMMAND_TYPE_CANCEL(_data: any): Promise<any> {
    return this.clearOverlays();
  }

  COMMAND_TYPE_USE(data: any): Promise<any> {
    return this.postMessage!("useClickable", {
      index: data.index,
    });
  }
}
