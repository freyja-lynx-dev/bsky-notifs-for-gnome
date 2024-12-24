# bsky-notifs-for-gnome
GNOME Shell extension for putting Bluesky notifications in your GNOME notification center!
Featuring an extremely incomplete reimplemntation of only the necessary ATProto APIs and Bluesky lexicons based on GNOME libraries.
Additionally, you can set your Priority Notification preference in the extension's preferences.

## Notes
- Before using, enter your handle and an app password in the preferences.
- When enabled, an RSS icon will appear in your status bar. Click it to get notifications.
- `maxNotifications` does not work, as GNOME limits any notification source to three at once.
- `checkintervalminutes` does nothing. Feel free to change it if you'd like anyways.
- The codebase is messy -- this was more of a proof of concept and learning experience than someting I intend people to use
- The extension may be a bit memory-leaky. The obvious things should be handled.
- **I don't recommend using this, but have fun with it anyways!** It is released as-is.

## Installation
1. Clone repository.
2. `make install`
3. Reload GNOME Shell
4. Configure and enable.

# Special Thanks
- [atcute](https://github.com/mary-ext/atcute/tree/trunk) -- Helpful reference for reimplementing ATProto calls in native GNOME libraries
- [PinIt](https://github.com/cankurttekin/PinIt-gnome-shell-extension) and [TwitchLive-Extension](https://github.com/maweki/twitchlive-extension/) -- helpful references for how GNOME extensions work
