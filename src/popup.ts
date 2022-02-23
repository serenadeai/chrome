const showClickablesCheckbox = document.getElementById("showClickables") as HTMLInputElement;
const reconnectButton = document.getElementById("reconnect") as HTMLAnchorElement;

async function reconnect() {
  console.log("reconnect")
  chrome.runtime.sendMessage({
    type: "reconnnect",
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

console.log(reconnectButton);
document.addEventListener("DOMContentLoaded", restoreSettings);
reconnectButton?.addEventListener("click", reconnect);
showClickablesCheckbox?.addEventListener("change", saveSettingsAndUpdate);
