import Port = chrome.runtime.Port;

const inViewport = (node: HTMLElement) => {
  const bounding = node.getBoundingClientRect();

  return (
    bounding.top > 0 &&
    bounding.top < window.innerHeight &&
    bounding.left > 0 &&
    bounding.left < window.innerWidth
  );
};

const nodesMatching = (path?: string, overlayType?: string) => {
  const result: Node[] = [];

  if (path && path.length) {
    const snapshot = document.evaluate(
      `.//*[not(self::script)][not(self::noscript)][not(self::title)][not(self::meta)][not(self::svg)][not(self::img)][not(self::style)][text()[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${path}')]]`,
      document,
      null,
      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      null
    );
    for (let i = 0; i < snapshot.snapshotLength; i++) {
      const item = snapshot.snapshotItem(i);
      if (item !== null && inViewport(item as HTMLElement)) {
        result.push(item);
      }
    }
  } else {
    const elements = document.querySelectorAll(
      overlayType === "links" ? "a, button" : "input, textarea, div[contenteditable]"
    );
    for (let i = 0; i < elements.length; i++) {
      if (overlayType !== "links" || !/^\s*$/.test(elements[i].innerHTML)) {
        if (inViewport(elements[i] as HTMLElement)) {
          result.push(elements[i]);
        }
      }
    }
  }

  return result;
};

export const findClickable = (port: Port, data: { path: string }, clickables: Node[]) => {
  if (clickables.length && parseInt(data.path, 10) < clickables.length) {
    port.postMessage({ clickable: true });
  } else if (nodesMatching(data.path).length) {
    port.postMessage({ clickable: true });
  } else {
    port.postMessage({ clickable: false });
  }
};

export const clearOverlays = (port: Port) => {
  const overlays = document.getElementsByClassName("serenade-overlay");
  while (overlays[0]) {
    overlays[0].parentNode!.removeChild(overlays[0]);
  }
  port.postMessage({ success: true });
};

const showOverlayForPath = (path: string, overlayType?: string) => {
  let counter = 1;
  const bodyRect = document.body.getBoundingClientRect();
  const elements = nodesMatching(path, overlayType);
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
  return elements;
};

export const showOverlay = (port: Port, data: { path: string; overlayType: string }) => {
  const elements = showOverlayForPath(data.path, data.overlayType);
  port.postMessage({ success: true });
  return elements;
};

export const click = (port: Port, data: { path: string | number }, clickables: Node[]) => {
  let nodes: Node[] = [];
  if (clickables.length === 0) {
    nodes = showOverlayForPath(data.path as string);
    if (nodes.length === 1) {
      (nodes[0] as HTMLElement).click();
    }
  } else {
    const node = clickables[(data.path as number) - 1];
    if (
      node instanceof HTMLInputElement ||
      node instanceof HTMLTextAreaElement ||
      node instanceof HTMLDivElement
    ) {
      node.focus();
    } else if (node) {
      (node as HTMLElement).click();
    }
  }
  port.postMessage({ success: true });
  if (nodes.length === 0) {
    clearOverlays(port);
  }
  return nodes;
};
