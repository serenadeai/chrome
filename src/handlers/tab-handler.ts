/*
 * Handles commands from the client about tabs.
 */

export default class TabHandler {
  async COMMAND_TYPE_CREATE_TAB(_data: any): Promise<any> {
    chrome.tabs.create({});
  }

  async COMMAND_TYPE_DUPLICATE_TAB(_data: any): Promise<any> {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, lastFocusedWindow: true }, (activeTab) => {
        if (!activeTab || activeTab.length === 0) {
          resolve();
        }
        chrome.tabs.duplicate(activeTab[0].id!, resolve);
      });
    });
  }

  async COMMAND_TYPE_CLOSE_TAB(_data: any): Promise<any> {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
        if (!tabs || tabs.length === 0) {
          resolve();
        }

        chrome.tabs.remove(tabs[0].id!, resolve);
      });
    });
  }

  private async changeTab(direction: number): Promise<any> {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, lastFocusedWindow: true }, (activeTab) => {
        if (!activeTab || activeTab.length === 0) {
          resolve();
        }

        chrome.tabs.query({ lastFocusedWindow: true }, (tabs) => {
          const tabCount = tabs.length;
          let index = (activeTab[0].index + direction) % tabCount;
          if (index === -1) {
            index = tabCount - 1;
          }

          chrome.tabs.query({ lastFocusedWindow: true, index }, (tab) => {
            if (!tab || tab.length === 0) {
              resolve();
            }

            chrome.tabs.update(tab[0].id!, { active: true }, resolve);
          });
        });
      });
    });
  }

  async COMMAND_TYPE_NEXT_TAB(_data: any): Promise<any> {
    return this.changeTab(1);
  }

  async COMMAND_TYPE_PREVIOUS_TAB(_data: any): Promise<any> {
    return this.changeTab(-1);
  }

  async COMMAND_TYPE_SWITCH_TAB(data: any): Promise<any> {
    chrome.tabs.query({ index: data.index - 1, lastFocusedWindow: true }, (tab) => {
      chrome.tabs.update(tab[0].id!, { active: true }, (_v: any) => {});
    });
  }
}
