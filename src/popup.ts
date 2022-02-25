const showClickablesCheckbox = document.getElementById("showClickables") as HTMLInputElement;
const docsButton = document.getElementById("docs") as HTMLAnchorElement;
const reconnectButton = document.getElementById("reconnect") as HTMLAnchorElement;

document.addEventListener("DOMContentLoaded", async () => {
  chrome.storage.sync.get(
    {
      alwaysShowClickables: false,
    },
    function (settings) {
      showClickablesCheckbox.checked = settings.alwaysShowClickables;
    }
  );
});

docsButton.addEventListener("click", (event) => {
  event.preventDefault();
  chrome.tabs.create({ url: "https://serenade.ai/docs" })
});

reconnectButton?.addEventListener("click", (event) => {
  event.preventDefault();
  chrome.runtime.sendMessage({
    type: "reconnect",
  });
});

showClickablesCheckbox?.addEventListener("change", () => {
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
});
