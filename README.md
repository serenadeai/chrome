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
    
## Commands

Commands supported:

- Editor state
    - TODO: `COMMAND_TYPE_GET_EDITOR_STATE`'
    - `type`
        - TODO: `COMMAND_TYPE_DIFF`
- Navigation
    - `back`
    - `forward`
    - `reload`
    - `scroll (left | right | up | down)`
    - `scroll to <text>`
- Tab management
    - `new tab`
        - `COMMAND_TYPE_CREATE_TAB`
    - `close tab`
    - `next tab`, `previous tab`
    - `(first | second ...) tab`
        - `COMMAND_TYPE_SWITCH_TAB`
- Actions
    - `show (links | inputs)`
    - `click`
    - `COMMAND_TYPE_CLICKABLE`
    - `clear`
        - `COMMAND_TYPE_CANCEL`
    
TODO:    
- improve click selectors
- proper type/go to/select/copy/paste/change/delete
- custom
    - go to tab
    - google search results
    - searching docs
