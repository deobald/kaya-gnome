/* main.js
 *
 * Copyright 2025 Steven Deobald
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import GObject from "gi://GObject";
import Gio from "gi://Gio";
import GLib from "gi://GLib";
import Gtk from "gi://Gtk?version=4.0";
import Gdk from "gi://Gdk?version=4.0";
import Adw from "gi://Adw?version=1";

import { KayaGnomeWindow } from "./window.js";

Gio._promisify(
  Gio.File.prototype,
  "load_contents_async",
  "load_contents_finish",
);

pkg.initGettext();
pkg.initFormat();

export const KayaGnomeApplication = GObject.registerClass(
  class KayaGnomeApplication extends Adw.Application {
    constructor() {
      super({
        application_id: "ca.deobald.Kaya",
        flags: Gio.ApplicationFlags.DEFAULT_FLAGS,
        resource_base_path: "/ca/deobald/Kaya",
      });

      this.set_accels_for_action("win.open", ["<Ctrl>o"]);

      const quit_action = new Gio.SimpleAction({ name: "quit" });
      quit_action.connect("activate", (action) => {
        this.quit();
      });
      this.add_action(quit_action);
      this.set_accels_for_action("app.quit", ["<control>q"]);

      const show_about_action = new Gio.SimpleAction({ name: "about" });
      show_about_action.connect("activate", (action) => {
        const aboutParams = {
          application_name: "kaya-gnome",
          application_icon: "ca.deobald.Kaya",
          developer_name: "Steven Deobald",
          version: "0.1.0",
          developers: ["Steven Deobald"],
          // Translators: Replace "translator-credits" with your name/username, and optionally an email or URL.
          translator_credits: _("translator-credits"),
          copyright: "© 2025 Steven Deobald",
        };
        const aboutDialog = new Adw.AboutDialog(aboutParams);
        aboutDialog.present(this.active_window);
      });
      this.add_action(show_about_action);
    }

    vfunc_activate() {
      let { active_window } = this;

      if (!active_window) active_window = new KayaGnomeWindow(this);

      active_window.present();
    }

    vfunc_dbus_register(connection, object_path) {
      super.vfunc_dbus_register(connection, object_path);

      const interfaceXml = `
        <node>
          <interface name="ca.deobald.Kaya">
            <method name="Show">
              <annotation name="org.freedesktop.DBus.Method.NoReply" value="true"/>
            </method>
          </interface>
        </node>
      `;

      const nodeInfo = Gio.DBusNodeInfo.new_for_xml(interfaceXml);
      connection.register_object(
        object_path,
        nodeInfo.interfaces[0],
        (
          connection,
          sender,
          objectPath,
          interfaceName,
          methodName,
          parameters,
        ) => {
          if (methodName === "Show") {
            this.activate();
            const window = this.active_window;
            if (window) {
              // Use GDK_CURRENT_TIME to bypass focus-stealing prevention
              window.present_with_time(Gdk.CURRENT_TIME);
            }
          }
        },
        null,
        null,
      );

      return true;
    }
  },
);

export function main(argv) {
  const application = new KayaGnomeApplication();
  return application.runAsync(argv);
}
