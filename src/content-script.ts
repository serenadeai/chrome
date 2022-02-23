function injectScript(path: string) {
  const script = document.createElement("script");
  script.setAttribute("type", "text/javascript");
  script.setAttribute("src", path);
  document.documentElement.appendChild(script);
}

injectScript(chrome.runtime.getURL("build/injected.js"));

let resolvers: { [k: number]: any } = [];
document.addEventListener(`serenade-injected-script-command-response`, (e: any) => {
  if (resolvers[e.detail.id]) {
    resolvers[e.detail.id](e.detail);
    delete resolvers[e.detail.id];
  }
});

chrome.runtime.onMessage.addListener(async (request, _sender, sendResponse) => {
  if (request.type == "injected-script-command-request") {
    const id = Math.random();
    const response = await new Promise((resolve) => {
      resolvers[id] = resolve;
      document.dispatchEvent(
        new CustomEvent(`serenade-injected-script-command-request`, {
          detail: {
            id,
            data: request.data,
          },
        })
      );
    });

    sendResponse(response);
  }

  return true;
});
