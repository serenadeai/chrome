# Serenade Chrome extension

## Setup

1. Clone this `chrome` repo into the same folder as [`editor-shared`](https://github.com/serenadeai/editor-shared), so the `src/shared` symlink works for shared files.
    - Be sure to pull the latest versions of both repos.
2. Use a recent version of Node (12 or so) and run `yarn` to get dependencies.
3. Run `yarn build` (or `yarn watch` if iterating).
    - This generates a `build/extension.js` file in this directory from `src`.
4. In Chrome, go to `chrome://extensions/` and enable Developer Mode in the top right.
5. Click `Load unpacked` and select the `chrome` repo directory.
6. Open a new tab, and go to a website like GitHub.
    - The extension icon in the top right should turn from monochrome (disabled for certain pages) to orange and black.
    - If the client is also running, then it will also register the Chrome plugin as being installed in `~/.serenade/serenade.json`, where `"plugins"` now includes `"chrome"`.
7. After iterating on the source, the refresh button at `chrome://extensions/` for the unpacked extension needs to be clicked, and the target tab needs to be reloaded for the new build to be used.
    
## Build

1. Update the version number in `manifest.json`.
2. Run `yarn dist`.
3. If you've added new files, consider updating the `dist` command in `package.json` to include them, if `webpack` does not. To test, unzip `build.zip` into a new directory, like `build2`, and load it in Chrome.

## Commands

Commands supported:

- Editor state
    - `COMMAND_TYPE_GET_EDITOR_STATE`
    - `COMMAND_TYPE_SELECT`
    - `COMMAND_TYPE_DIFF` for:
      - `change`
      - `copy/cut/paste <selector>`
      - `delete <selector>`
      - `line x`
      - `type <text>`
- Navigation
    - `back`
    - `forward`
    - `reload`
    - `scroll (left | right | up | down)`
    - `scroll to <text>`
    - `go to` (navigates)
- Tab management
    - `new tab`
    - `close tab`
    - `next tab`, `previous tab`
    - `(first | second ...) tab`
    - `duplicate tab`
- Actions
    - `show (links | inputs | code)` to overlay clickable/copyable elements
    - `click (text | number)` to click based on text or previous clickables
    - `use number` to click or copy previous clickables
    - `COMMAND_TYPE_CLICKABLE` to invalidate alternatives
    - `clear` to reset overlays
    
TODO:
- custom
    - go to tab
    - searching docs
