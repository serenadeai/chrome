import Port = chrome.runtime.Port;

const nodesMatching = (path?: string, overlayType?: string) => {
  const result: Node[] = [];

  if (path !== undefined) {
    const snapshot = document.evaluate(
      ".//*[not(self::script)][not(self::noscript)][not(self::title)][not(self::meta)][not(self::svg)][not(self::img)][not(self::style)][text()[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${path}')]]",
      document,
      null,
      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      null
    );
    for (let i = 0; i < snapshot.snapshotLength; i++) {
      const item = snapshot.snapshotItem(i);
      if (item !== null) {
        result.push(item);
      }
    }
  } else {
    const elements = document.querySelectorAll(
      overlayType === "LINKS" ? "a, button" : "input, textarea, div[contenteditable]"
    );
    for (let i = 0; i < elements.length; i++) {
      if (overlayType !== "LINKS" || !/^\s*$/.test(elements[i].innerHTML)) {
        result.push(elements[i]);
      }
    }
  }

  return result;
};

const findClickable = (port: Port, data: { path: string }) => {
  port.postMessage({ length: nodesMatching(data.path).length });
};

export const clearOverlays = (port: Port) => {
  const overlays = document.getElementsByClassName("serenade-overlay");
  while (overlays[0]) {
    overlays[0].parentNode!.removeChild(overlays[0]);
  }
  port.postMessage({ success: true });
};

export const showOverlay = (
  port: Port,
  data: { path: string; text: string; overlayType: string }
) => {
  let counter = 1;
  const bodyRect = document.body.getBoundingClientRect();
  const elements = nodesMatching(data.path, data.overlayType);
  for (let i = 0; i < elements.length; i++) {
    const elementRect = (elements[i] as HTMLElement).getBoundingClientRect();
    const overlay = document.createElement("div");
    overlay.innerHTML = counter.toString();
    overlay.className = "serenade-overlay";
    overlay.style.position = "absolute";
    overlay.style.zIndex = "999";
    overlay.style.top = elementRect.top - bodyRect.top + "px";
    overlay.style.left = elementRect.left - bodyRect.left + "px";
    overlay.style.padding = "3px";
    overlay.style.textAlign = "center";
    overlay.style.color = "#e6ecf2";
    overlay.style.background = "#1c1c16";
    overlay.style.border = "1px solid #e6ecf2";
    overlay.style.borderRadius = "3px";
    overlay.style.opacity = "0.8";
    overlay.style.fontFamily =
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif';

    document.body.appendChild(overlay);
    counter++;
  }
  port.postMessage({ success: true });
};

const click = (
  port: Port,
  data: { path: string | number; overlayPath: string; overlayType: string }
) => {
  if (data.overlayType === "NONE") {
    (nodesMatching(data.path as string)[0] as HTMLElement).click();
  } else {
    const node = nodesMatching(data.overlayPath)[(data.path as number) - 1];
    if (
      node instanceof HTMLInputElement ||
      node instanceof HTMLTextAreaElement ||
      node instanceof HTMLDivElement
    ) {
      node.focus();
    } else {
      (node as HTMLElement).click();
    }
  }
  port.postMessage({ success: true });
};
