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
  // These are declared by CommandHandler, which we extend
  postMessage?: (request: string, data?: any) => Promise<any>;

  private overlayPath: string = "";
  private overlayType: OverlayType = OverlayType.None;

  private async clearOverlays() {
    await this.postMessage!("clearOverlays");
    this.overlayPath = "";
    this.overlayType = OverlayType.None;
  }

  async COMMAND_TYPE_SHOW(data: any): Promise<any> {
    await this.clearOverlays();

    this.overlayPath = data.path;
    this.overlayType = OverlayType.Links;
    if (data.text === "inputs") {
      this.overlayType = OverlayType.Inputs;
    }

    await this.postMessage!("showOverlay", {
      path: data.path,
      text: data.text,
      overlayType: this.overlayType,
    });
  }

  async COMMAND_TYPE_CLICK(data: any): Promise<any> {
    const path = this.overlayType !== OverlayType.None ? this.overlayPath : data.path;
    await this.postMessage!("click", {
      path,
      overlayPath: this.overlayPath,
      overlayType: this.overlayType,
    });
    await this.clearOverlays();
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
      this.postMessage!("findClickable", {
        path: data.path,
      }).then((data) => {
        resolve({
          message: "clickable",
          data: {
            clickable: data.length > 0,
          },
        });
      });
      // CommandHandler.executeScript(`${this.nodesMatching(data.path)}.length > 0;`, (result) => {
      //
      // });
    });
  }

  async COMMAND_TYPE_CANCEL(_data: any): Promise<any> {
    await this.clearOverlays();
  }
}
