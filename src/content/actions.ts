import Port = chrome.runtime.Port;

const inViewport = (node: HTMLElement) => {
  const bounding = node.getBoundingClientRect();

  if (
    !node.contains(document.elementFromPoint(bounding.left + 1, bounding.top + 1)) &&
    !node.contains(document.elementFromPoint(bounding.right - 1, bounding.top + 1)) &&
    !node.contains(document.elementFromPoint(bounding.left + 1, bounding.bottom - 1)) &&
    !node.contains(document.elementFromPoint(bounding.right - 1, bounding.bottom - 1))
  ) {
    console.log(node.innerText, document.elementFromPoint(bounding.left + 1, bounding.top + 1));
    return false;
  }
  return (
    bounding.top > 0 &&
    bounding.top < window.innerHeight &&
    bounding.left > 0 &&
    bounding.left < window.innerWidth &&
    !!(node.offsetWidth || node.offsetHeight || node.getClientRects().length)
  );
};

const nodesMatching = (path?: string, overlayType?: string) => {
  const result: Node[] = [];

  if (path && path.length) {
    const snapshot = document.evaluate(
      `.//*[not(self::script)][not(self::noscript)][not(self::title)][not(self::meta)][not(self::svg)][not(self::img)][not(self::style)][text()[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${path}')]]|//input[contains(translate(@placeholder, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${path}')]`,
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
      if (inViewport(elements[i] as HTMLElement)) {
        result.push(elements[i]);
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
  const bodyRect = (document.body.parentNode! as HTMLElement).getBoundingClientRect();
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

export const click = (port: Port, data: { path: string }, clickables: Node[]) => {
  clearOverlays(port);
  let nodes: Node[] = [];
  const pathNumber = parseInt(data.path, 10);
  if (clickables.length === 0 || isNaN(pathNumber)) {
    nodes = showOverlayForPath(data.path as string);
    if (nodes.length === 1) {
      (nodes[0] as HTMLElement).focus();
      (nodes[0] as HTMLElement).click();
      nodes = [];
    }
  } else {
    const node = clickables[pathNumber - 1];
    (node as HTMLElement).focus();
    (node as HTMLElement).click();
  }
  port.postMessage({ success: true });
  if (nodes.length === 0) {
    clearOverlays(port);
  }
  return nodes;
};
