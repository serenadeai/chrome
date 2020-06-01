import Port = chrome.runtime.Port;

export const scrollDirection = (port: Port, data: { direction: string }) => {
  let direction;
  switch (data.direction) {
    case "left":
      direction = { left: -window.innerWidth * 0.8 };
      break;
    case "right":
      direction = { left: window.innerWidth * 0.8 };
      break;
    case "up":
      direction = { top: -window.innerWidth * 0.8 };
      break;
    case "down":
      direction = { top: window.innerWidth * 0.8 };
      break;
  }
  if (direction) {
    window.scrollBy(Object.assign(direction, { behavior: "smooth" }));
  }
  port.postMessage({ success: true });
};

// Given a path to match on, scroll to it if found
export const findMatchAndScroll = (port: Port, data: { path: string }) => {
  const path = data.path;
  // Matches based on content ("path")
  const snapshot = document.evaluate(
    `.//*[not(self::script)][not(self::noscript)][not(self::title)][not(self::meta)][not(self::svg)][not(self::img)][not(self::style)][text()[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${path}')]]`,
    document,
    null,
    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
    null
  );
  const matches = [];
  for (let i = 0; i < snapshot.snapshotLength; i++) {
    matches.push(snapshot.snapshotItem(i));
  }
  // A match that is below or to the right of the window
  let target = matches.find((node) => {
    const bounding = (node as Element).getBoundingClientRect();
    return bounding.top >= window.innerHeight || bounding.left >= window.innerWidth;
  });
  // If no match, look for the first match that is above the window
  if (target === undefined) {
    target = matches.find((node) => {
      const bounding = (node as Element).getBoundingClientRect();
      return bounding.top < 0 || bounding.left < 0;
    });
  }
  // If still no match (only match is in window), use the first one anyways
  if (target === undefined && matches.length) {
    target = matches[0];
  }
  // If still no match, stop
  if (target === undefined) {
    port.postMessage({ success: false });
    return;
  }

  const style = window.getComputedStyle(target as Element);
  const backgroundColor = style.getPropertyValue("background-color");
  (target as HTMLElement).style.backgroundColor = "yellow";
  (target as HTMLElement).style.transition = "background-color 0.5s";
  (target as Element).scrollIntoView({
    block: "center",
    inline: "center",
    behavior: "smooth",
  });
  window.setTimeout(() => {
    (target as HTMLElement).style.backgroundColor = backgroundColor;
  }, 2000);
  port.postMessage({ success: true });
};
