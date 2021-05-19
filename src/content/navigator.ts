import Tab from "./tab";

export default class Navigator {
  canScrollHorizontally(element: Element): boolean {
    const overflow = window.getComputedStyle(element).overflowX;
    return (
      element.scrollWidth > element.clientWidth && (overflow === "scroll" || overflow === "auto")
    );
  }

  canScrollVertically(element: Element): boolean {
    const overflow = window.getComputedStyle(element).overflowY;
    return (
      element.scrollHeight > element.clientHeight && (overflow === "scroll" || overflow === "auto")
    );
  }

  scrollOptions(element: Element | Window, direction: string): ScrollOptions {
    let dir = {};
    if ("clientWidth" in element) {
      // Element type
      switch (direction) {
        case "left":
          dir = { left: -element.clientWidth * 0.6 };
          break;
        case "right":
          dir = { left: element.clientWidth * 0.6 };
          break;
        case "up":
          dir = { top: -element.clientHeight * 0.6 };
          break;
        case "down":
          dir = { top: element.clientHeight * 0.6 };
      }
    } else {
      // Window type
      switch (direction) {
        case "left":
          dir = { left: -element.innerWidth * 0.8 };
          break;
        case "right":
          dir = { left: element.innerWidth * 0.8 };
          break;
        case "up":
          dir = { top: -element.innerHeight * 0.8 };
          break;
        case "down":
          dir = { top: element.innerHeight * 0.8 };
      }
    }

    return Object.assign(dir, { behavior: "smooth" }) as ScrollOptions;
  }

  public scrollDirection = async (direction: string): Promise<boolean> => {
    const horizontal = direction === "left" || direction === "right";
    const vertical = direction === "up" || direction === "down";
    // Quick validation
    if (horizontal || vertical) {
      // Get the last hovered element, which should be the childmost node
      const elements = document.querySelectorAll("*:hover");
      let element = elements.length ? elements[elements.length - 1] : null;
      let scrolled = false;
      // Try to scroll if possible, going up recursively
      while (element && !scrolled) {
        if (
          (horizontal && this.canScrollHorizontally(element)) ||
          (vertical && this.canScrollVertically(element))
        ) {
          element.scrollBy(this.scrollOptions(element, direction));
          scrolled = true;
        } else {
          element = element.parentElement;
        }
      }
      if (!scrolled) {
        // Fall back to scrolling window-wide
        window.scrollBy(this.scrollOptions(window, direction));
      }
    }
    // scrollBy isn't an asynchronous function, even though it behaves like one,
    // so there needs to be a timeout to enable "scroll down two times"
    await new Promise((resolve) => {
      setTimeout(resolve, 300);
    });
    return true;
  };

  public async scrollToTop(): Promise<boolean> {
    const scrollToOptions: ScrollToOptions = { top: 0, left: 0, behavior: "smooth" };
    window.scrollTo(scrollToOptions);
    return true;
  }

  // Given a path to match on, scroll to it if found
  public async findMatchAndScroll(path: string): Promise<boolean> {
    // Matches based on content ("path")
    const snapshot = document.evaluate(
      `.//*[not(self::script)][not(self::noscript)][not(self::title)][not(self::meta)][not(self::svg)][not(self::img)][not(self::style)][text()[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), "${path}")]]`,
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
      return false;
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
    return true;
  }
}
