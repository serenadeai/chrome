function injectScript(path: string) {
  const script = document.createElement("script");
  script.setAttribute("type", "text/javascript");
  script.setAttribute("src", path);
  document.documentElement.appendChild(script);
}

function injectCSS(path: string) {
  const css = document.createElement("link")
  css.setAttribute("rel", "stylesheet");
  css.setAttribute("type", "text/css");
  css.setAttribute("href", path);
  document.documentElement.appendChild(css);
}

injectScript(chrome.runtime.getURL("build/injected.js"));
injectCSS(chrome.runtime.getURL("src/injected.css"));

let resolvers: { [k: number]: any } = [];
document.addEventListener(`serenade-injected-script-command-response`, (e: any) => {
  if (resolvers[e.detail.id]) {
    resolvers[e.detail.id](e.detail);
    delete resolvers[e.detail.id];
  }
});

async function sendMessageToInjectedScript(data: any) {
  const id = Math.random();
  const response = await new Promise((resolve) => {
    resolvers[id] = resolve;
    document.dispatchEvent(
      new CustomEvent(`serenade-injected-script-command-request`, {
        detail: {
          id,
          data: data,
        },
      })
    );
  });
  return response
}

chrome.runtime.onMessage.addListener(async (request, _sender, sendResponse) => {
  if (request.type == "injected-script-command-request") {
    const response = await sendMessageToInjectedScript(request.data)
    sendResponse(response);
  }
  return true;
});

document.addEventListener("DOMContentLoaded", async () => {
  const settings = await chrome.storage.sync.get(["alwaysShowClickables"]);
  sendMessageToInjectedScript({
    type: "clearOverlays"
  })
  sendMessageToInjectedScript({
    type: "updateSettings",
    ...settings,
  })
});
