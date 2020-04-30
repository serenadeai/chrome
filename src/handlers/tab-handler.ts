/*
 * Handles commands from the client about tabs.
 */

export default class TabHandler {
  async COMMAND_TYPE_CREATE_TAB(_data: any): Promise<any> {
    chrome.tabs.create({});
  }

  async COMMAND_TYPE_CLOSE_TAB(_data: any): Promise<any> {
    chrome.tabs.query({ currentWindow: true, active: true }, (current) => {
      if (!current || current.length === 0) {
        return;
      }

      chrome.tabs.remove(current[0].id!);
    });
  }

  async COMMAND_TYPE_NEXT_TAB(_data: any): Promise<any> {
    chrome.tabs.query({ currentWindow: true, active: true }, (current) => {
      if (!current || current.length === 0) {
        return;
      }

      chrome.tabs.query({ currentWindow: true, index: current[0].index + 1 }, (tab) => {
        if (!tab || tab.length === 0) {
          return;
        }

        chrome.tabs.update(tab[0].id!, { active: true }, (_v: any) => {});
      });
    });
  }

  async COMMAND_TYPE_PREVIOUS_TAB(_data: any): Promise<any> {
    chrome.tabs.query({ currentWindow: true, active: true }, (current) => {
      if (!current || current.length === 0) {
        return;
      }

      chrome.tabs.query({ currentWindow: true, index: current[0].index - 1 }, (tab) => {
        if (!tab || tab.length === 0) {
          return;
        }

        chrome.tabs.update(tab[0].id!, { active: true }, (_v: any) => {});
      });
    });
  }

  async COMMAND_TYPE_SWITCH_TAB(data: any): Promise<any> {
    chrome.tabs.query({ currentWindow: true, index: data.index - 1 }, (tab) => {
      chrome.tabs.update(tab[0].id!, { active: true }, (_v: any) => {});
    });
  }
}
