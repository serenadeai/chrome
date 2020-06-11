import Port = chrome.runtime.Port;

// Displays a notification
export const showNotification = (port: Port, data: { text: string }) => {
  const overlay = document.createElement("div");
  overlay.innerHTML = data.text;
  overlay.setAttribute(
    "style",
    `
      position: fixed;
      z-index: 9999;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      padding: 12px;
      text-align: center;
      color: #e6ecf2;
      background: #1c1c16;
      border: 1px solid #e6ecf2;
      border-radius: 6px;
      opacity: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
      font-size: 16px;
      transition: opacity 0.5s;
    `
  );
  document.body.appendChild(overlay);

  window.setTimeout(() => {
    overlay.style.opacity = "0.8";
  }, 200);

  window.setTimeout(() => {
    overlay.style.opacity = "0";
  }, 2000);

  window.setTimeout(() => {
    overlay.parentNode && overlay.parentNode.removeChild(overlay);
  }, 3000);

  port.postMessage({ success: true });
};
