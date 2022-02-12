const showClickablesCheckbox = document.getElementById("showClickables") as HTMLInputElement;

function updateSettings() {
  const settings = {
    alwaysShowClickables: showClickablesCheckbox.checked,
  };
  chrome.runtime.sendMessage({
    command: "updateSettings",
    data: settings,
  });
}

showClickablesCheckbox?.addEventListener("change", updateSettings);