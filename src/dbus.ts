import '@girs/gjs'
import '@girs/gjs/dom'
import '@girs/gtk-4.0'
import '@girs/gio-2.0'
import '@girs/glib-2.0'
import '@girs/adw-1'

import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import type Adw from 'gi://Adw';

const IFACE_XML = `
<node>
  <interface name="com.example.MyApp">
    <method name="Show"/>
  </interface>
</node>
`;

export class MyAppDBus {
  private impl: Gio.DBusExportedObject;

  constructor(app: Adw.Application) {
    this.impl = Gio.DBusExportedObject.wrapJSObject(IFACE_XML, {
      Show: () => {
        const win = app.get_active_window();
        if (win) {
          win.present();
        } else {
          app.activate();
        }
      },
    });

    this.impl.export(
      Gio.DBus.session,
      '/com/example/MyApp'
    );

    Gio.bus_own_name(
      Gio.BusType.SESSION,
      'com.example.MyApp',
      Gio.BusNameOwnerFlags.NONE,
      null,
      null
    );
  }
}
