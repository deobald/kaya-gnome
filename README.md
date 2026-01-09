# kaya-gnome

A description of this project.

## Thoughts from Adrian

https://flatpak.github.io/xdg-desktop-portal/docs/doc-org.freedesktop.portal.GlobalShortcuts.html#org-freedesktop-portal-globalshortcuts-activated Yep:

> `activation_token`: A token that can be used to activate a window in response to the shortcut getting activated.

In theory, this should be as easy as:
- Register your activation shortcut with the GlobalShortcut portal.
- `Activated` is emitted on keydown, and `Deactivated` on keyup. I assume you'd want your UI to appear on keyup, so listen to `Deactivated`
- In the handler you're given an activation token
- Feed the activation token into GTK
- Call window.present()

https://docs.gtk.org/gtk4/method.Window.set_startup_id.html

So I think you'd call `window.set_startup_id(id_from_global_shortcuts)` followed by `window.present()`. And that should do the trick, in theory?
