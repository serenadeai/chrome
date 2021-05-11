import Tab from "./tab";
import Port = chrome.runtime.Port;

export default class CommandHandler {
  public async applyDiff(data: { source: string; cursor: number }): Promise<any> {
    return { success: await Tab.editor.applyDiff(data.source, data.cursor) };
  }

  public async editorState(): Promise<any> {
    if (document.hasFocus()) {
      const source = await Tab.editor.activeElementSource();
      const cursor = await Tab.editor.activeElementCursor();
      const filename = await Tab.editor.activeElementFilename();
      const clickableCount = Tab.overlay.clickables.length;
      const error = source == null;
      return { source, cursor, filename, clickableCount, error };
    } else {
      return { filename: "serenade-chrome-address-bar", error: true };
    }
  }

  // Gets clipboard contents
  public async getClipboard() {
    try {
      return { text: await navigator.clipboard.readText() };
    } catch {
      return { success: false };
    }
  }

  // Copies text to clipboard
  public async copy(data: { text: string }) {
    await navigator.clipboard.writeText(data.text);
    return { success: true };
  }

  public async selectActiveElement(data: { cursor: number; cursorEnd: number }): Promise<any> {
    return {
      success: await Tab.editor.selectActiveElement(data.cursor, data.cursorEnd),
    };
  }

  public async setCursor(data: { cursor: number }): Promise<any> {
    await Tab.editor.setCursor(data.cursor);
    return { success: true, adjustCursor: null };
  }

  public async navigateBack(): Promise<any> {
    window.history.back();
    return { success: true };
  }

  public async navigateForward(): Promise<any> {
    window.history.forward();
    return { success: true };
  }

  public async clearOverlays(): Promise<any> {
    Tab.overlay.clearOverlays();
    return { success: true };
  }

  public async showOverlay(data: any): Promise<any> {
    Tab.overlay.showOverlay(data.path, data.overlayType);
    return { success: true };
  }

  public async click(data: any): Promise<any> {
    Tab.overlay.click(data.path);
    return { success: true };
  }

  public async useClickable(data: any): Promise<any> {
    if (Tab.overlay.clickables.length === 0) {
      return { success: true };
    }
    if (Tab.overlay.clickableType === "copy") {
      return { success: await Tab.overlay.copyClickable(data.index) };
    } else if (Tab.overlay.clickableType === "click") {
      return Tab.overlay.click(data.index);
    } else {
      return { success: true };
    }
  }

  public async scrollDirection(data: { direction: string }): Promise<any> {
    return { success: await Tab.navigator.scrollDirection(data.direction) };
  }

  public async findMatchAndScroll(data: { path: string }) {
    return { success: await Tab.navigator.findMatchAndScroll(data.path) };
  }

  public findClickable(data: { path: string }) {
    // If the path is a number, check that it's valid
    const path = parseInt(data.path, 10);
    if (!isNaN(path)) {
      return { clickable: path - 1 < Tab.overlay.clickables.length };
    }
    // Otherwise, check if we have a match for the path
    else {
      return { clickable: Tab.overlay.nodesMatching(data.path).length };
    }
  }

  public showNotification(data: { text: string }) {
    Tab.notifications.show(data.text);
    return { success: true };
  }
}
