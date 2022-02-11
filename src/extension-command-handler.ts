export default class ExtensionCommandHandler {
  private async changeTab(direction: number): Promise<any> {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, lastFocusedWindow: true }, (activeTab) => {
        if (!activeTab || activeTab.length === 0) {
          resolve(null);
        }

        chrome.tabs.query({ lastFocusedWindow: true }, (tabs) => {
          const tabCount = tabs.length;
          let index = (activeTab[0].index + direction) % tabCount;
          if (index === -1) {
            index = tabCount - 1;
          }

          chrome.tabs.query({ lastFocusedWindow: true, index }, (tab) => {
            if (!tab || tab.length === 0) {
              resolve(null);
            }

            chrome.tabs.update(tab[0].id!, { active: true }, resolve);
          });
        });
      });
    });
  }

  async COMMAND_TYPE_BACK(_data: any): Promise<any> {
    chrome.tabs.goBack();
  }

  async COMMAND_TYPE_CLOSE_TAB(_data: any): Promise<any> {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
        if (!tabs || tabs.length === 0) {
          resolve(null);
        }

        chrome.tabs.remove(tabs[0].id!, resolve);
      });
    });
  }

  async COMMAND_TYPE_CREATE_TAB(_data: any): Promise<any> {
    chrome.tabs.create({});
  }

  async COMMAND_TYPE_DUPLICATE_TAB(_data: any): Promise<any> {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, lastFocusedWindow: true }, (activeTab) => {
        if (!activeTab || activeTab.length === 0) {
          resolve(null);
        }
        chrome.tabs.duplicate(activeTab[0].id!, resolve);
      });
    });
  }

  async COMMAND_TYPE_FORWARD(_data: any): Promise<any> {
    chrome.tabs.goForward();
  }

  async COMMAND_TYPE_NEXT_TAB(_data: any): Promise<any> {
    return this.changeTab(1);
  }

  async COMMAND_TYPE_PREVIOUS_TAB(_data: any): Promise<any> {
    return this.changeTab(-1);
  }

  async COMMAND_TYPE_RELOAD(_data: any): Promise<any> {
    chrome.tabs.reload();
  }

  async COMMAND_TYPE_SWITCH_TAB(data: any): Promise<any> {
    chrome.tabs.query({ lastFocusedWindow: true }, (tabs) => {
      const index = data.index > 0 ? data.index - 1 : tabs.length - 1;
      chrome.tabs.update(tabs[index].id!, { active: true }, (_v: any) => {});
    });
  }
}
