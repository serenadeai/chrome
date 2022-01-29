/**
 * injectScript - Inject internal script into the document's head element
 *
 * @param  {string} filePath Local path of the internal script.
 * @see    {@link http://stackoverflow.com/questions/20499994/access-window-variable-from-content-script}
 */
function injectScript(filePath) {
  const script = document.createElement("script");
  script.type = 'text/javascript';
  script.src = filePath;
  (document.head || document.documentElement).appendChild(script);
}

document.addEventListener("DOMContentLoaded", function() {
  injectScript(chrome.extension.getURL("build/page.js"));
});
