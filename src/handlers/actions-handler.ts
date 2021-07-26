/*
 * Handles commands from the client about actions, like clicks.
 */

export default class ActionsHandler {
  // These are declared by CommandHandler, which we extend
  postMessage?: (request: string, data?: any) => Promise<any>;
  resolvePostMessage?: (request: string, data?: any) => Promise<any>;

  private clearOverlays(): Promise<any> {
    return this.resolvePostMessage!("clearOverlays");
  }

  async COMMAND_TYPE_SHOW(data: any): Promise<any> {
    await this.clearOverlays();

    return this.resolvePostMessage!("showOverlay", {
      path: data.path,
      overlayType: data.text,
    });
  }

  COMMAND_TYPE_CLICK(data: any): Promise<any> {
    return this.resolvePostMessage!("click", {
      path: data.path,
      query: data.text,
    });
  }

  async COMMAND_TYPE_CLICKABLE(data: any): Promise<any> {
    const emptyResponse = { message: "clickable", data: [] };
    try {
      const ret: any = await this.postMessage!("findClickable", { path: data.path });
      if (!ret) {
        return emptyResponse;
      }
      return {
        message: "clickable",
        data: ret,
      };
    } catch (e) {
      return emptyResponse;
    }
  }

  COMMAND_TYPE_CANCEL(_data: any): Promise<any> {
    return this.clearOverlays();
  }

  COMMAND_TYPE_FOCUS(data: any): Promise<any> {
    return this.resolvePostMessage!(data.direction, {
      query: data.text,
    });
  }

  COMMAND_TYPE_USE(data: any): Promise<any> {
    return this.resolvePostMessage!("useClickable", {
      index: data.index,
    });
  }
}
