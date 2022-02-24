const showClickablesCheckbox = document.getElementById("showClickables") as HTMLInputElement;
const docsButton = document.getElementById("docs") as HTMLAnchorElement;
const reconnectButton = document.getElementById("reconnect") as HTMLAnchorElement;

async function openDocs() {
  chrome.tabs.create({ url: "https://serenade.ai/docs" })
}

async function reconnect() {
  chrome.runtime.sendMessage({
    type: "reconnect",
  });
}

async function restoreSettings() {
  chrome.storage.sync.get(
    {
      alwaysShowClickables: false,
    },
    function (settings) {
      showClickablesCheckbox.checked = settings.alwaysShowClickables;
    }
  );
}

function saveSettingsAndUpdate() {
  const settings = {
    alwaysShowClickables: showClickablesCheckbox.checked,
  };
  chrome.storage.sync.set({
    alwaysShowClickables: settings.alwaysShowClickables
  });
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (!tabs[0].id) {
      return;
    }
    chrome.tabs.sendMessage(tabs[0].id, {
      type: "injected-script-command-request",
      data: {
        type: "updateSettings",
        ...settings,
      },
    });
  });
}

document.addEventListener("DOMContentLoaded", restoreSettings);
docsButton.addEventListener("click", openDocs);
reconnectButton?.addEventListener("click", reconnect);
showClickablesCheckbox?.addEventListener("change", saveSettingsAndUpdate);
