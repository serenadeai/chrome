import Port = chrome.runtime.Port;

const inViewport = (node: HTMLElement) => {
  const bounding = node.getBoundingClientRect();

  // If all four of the corners are covered by another element, no need to show
  if (
    !node.contains(document.elementFromPoint(bounding.left + 1, bounding.top + 1)) &&
    !node.contains(document.elementFromPoint(bounding.right - 1, bounding.top + 1)) &&
    !node.contains(document.elementFromPoint(bounding.left + 1, bounding.bottom - 1)) &&
    !node.contains(document.elementFromPoint(bounding.right - 1, bounding.bottom - 1))
  ) {
    return false;
  }

  // Check that this is in the viewport and has some dimensions
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
    // Look for elements with matching containing text, input elements with matching placeholder text, or img elements
    // with matching alt text.
    const snapshot = document.evaluate(
      `.//*[not(self::script)][not(self::noscript)][not(self::title)][not(self::meta)][not(self::svg)][not(self::style)][text()[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${path}')]]|//input[contains(translate(@placeholder, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${path}')]|//img[contains(translate(@alt, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${path}')]`,
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
    // If no path, then look for all clickable or input elements
    let selectors = "input, textarea, div[contenteditable]";
    if (overlayType === "links") {
      selectors = "a, button";
    } else if (overlayType === "code") {
      selectors = "pre, code";
    }

    const elements = document.querySelectorAll(selectors);
    for (let i = 0; i < elements.length; i++) {
      if (inViewport(elements[i] as HTMLElement)) {
        result.push(elements[i]);
      }
    }
  }

  return result;
};

export const findClickable = (port: Port, data: { path: string }, clickables: Node[]) => {
  // If the path is a number, check that it's valid
  const path = parseInt(data.path, 10);
  if (!isNaN(path)) {
    port.postMessage({ clickable: path < clickables.length });
  }
  // Otherwise, check if we have a match for the path
  else {
    port.postMessage({ clickable: nodesMatching(data.path).length });
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
    overlay.style.zIndex = "9999";
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
  // If we are clicking a text path
  if (clickables.length === 0 || isNaN(pathNumber)) {
    nodes = showOverlayForPath(data.path as string);
    if (nodes.length === 1) {
      (nodes[0] as HTMLElement).focus();
      (nodes[0] as HTMLElement).click();
      nodes = [];
    }
  }
  // If we have a number that we can click
  else {
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
