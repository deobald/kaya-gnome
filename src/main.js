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

      this._globalShortcutsProxy = null;
      this._sessionHandle = null;
    }

    async _setupGlobalShortcut() {
      try {
        console.log("Creating XML...");
        const interfaceXml = `
          <node>
            <interface name="org.freedesktop.portal.GlobalShortcuts">
              <method name="CreateSession">
                <arg type="a{sv}" name="options" direction="in"/>
                <arg type="o" name="handle" direction="out"/>
              </method>
              <method name="BindShortcuts">
                <arg type="o" name="session_handle" direction="in"/>
                <arg type="aa{sv}" name="shortcuts" direction="in"/>
                <arg type="s" name="parent_window" direction="in"/>
                <arg type="a{sv}" name="options" direction="in"/>
                <arg type="o" name="handle" direction="out"/>
              </method>
              <signal name="Activated">
                <arg type="o" name="session_handle"/>
                <arg type="s" name="shortcut_id"/>
                <arg type="t" name="timestamp"/>
                <arg type="a{sv}" name="options"/>
              </signal>
            </interface>
          </node>
        `;

        console.log("Creating node from XML...");
        const nodeInfo = Gio.DBusNodeInfo.new_for_xml(interfaceXml);
        console.log("Creating GlobalShortcuts proxy...");
        this._globalShortcutsProxy = await new Promise((resolve, reject) => {
          Gio.DBusProxy.new(
            Gio.DBus.session,
            Gio.DBusProxyFlags.NONE,
            nodeInfo.interfaces[0],
            "org.freedesktop.portal.Desktop",
            "/org/freedesktop/portal/desktop",
            "org.freedesktop.portal.GlobalShortcuts",
            null,
            (source, result) => {
              try {
                const proxy = Gio.DBusProxy.new_finish(result);
                resolve(proxy);
              } catch (e) {
                reject(e);
              }
            },
          );
        });

        console.log("Registering signal with GlobalShortcuts proxy...");
        this._globalShortcutsProxy.connectSignal(
          "Activated",
          (proxy, sender, params) => {
            console.log(
              `Activated signal received with ${params.length} parameters`,
            );
            params.forEach((param, index) => {
              console.log(`Param ${index}: ${param} (type: ${typeof param})`);
            });
            const [sessionHandle, shortcutId, timestamp, options] = params;
            this._handleShortcutActivated(
              sessionHandle,
              shortcutId,
              timestamp,
              options,
            );
          },
        );

        console.log("Creating session with GlobalShortcuts proxy...");
        const sessionToken = `kaya_session_${Math.random().toString(36).substr(2, 9)}`;
        const handleToken = `kaya_handle_${Math.random().toString(36).substr(2, 9)}`;

        const uniqueName = Gio.DBus.session.unique_name;
        const senderName = uniqueName.substring(1).replace(/\./g, "_");
        const requestPath = `/org/freedesktop/portal/desktop/request/${senderName}/${handleToken}`;

        console.log(`Unique name: ${uniqueName}`);
        console.log(`Sender name: ${senderName}`);
        console.log(`Request path: ${requestPath}`);

        this._sessionHandle = await new Promise((resolve, reject) => {
          const timeout = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 10000, () => {
            reject(new Error("Timeout waiting for session creation response"));
            return GLib.SOURCE_REMOVE;
          });

          const signalId = Gio.DBus.session.signal_subscribe(
            "org.freedesktop.portal.Desktop",
            "org.freedesktop.portal.Request",
            "Response",
            requestPath,
            null,
            Gio.DBusSignalFlags.NONE,
            (connection, sender, path, iface, signal, params) => {
              console.log(`Received Response signal on path: ${path}`);
              GLib.source_remove(timeout);
              Gio.DBus.session.signal_unsubscribe(signalId);

              const [response, results] = params.deepUnpack();
              console.log(`Response code: ${response}`);
              console.log(`Results: ${JSON.stringify(results)}`);

              if (response === 0) {
                const sessionHandleVariant = results["session_handle"];
                console.log(
                  `Session handle from response: ${sessionHandleVariant}`,
                );
                if (sessionHandleVariant) {
                  const sessionHandle = sessionHandleVariant.deepUnpack
                    ? sessionHandleVariant.deepUnpack()
                    : sessionHandleVariant;
                  console.log(`Unpacked session handle: ${sessionHandle}`);
                  resolve(sessionHandle);
                } else {
                  reject(new Error("No session_handle in response"));
                }
              } else {
                reject(
                  new Error(`Request failed with response code: ${response}`),
                );
              }
            },
          );

          console.log(`Subscribed to signal with ID: ${signalId}`);

          this._globalShortcutsProxy.call(
            "CreateSession",
            new GLib.Variant("(a{sv})", [
              {
                session_handle_token: GLib.Variant.new_string(sessionToken),
                handle_token: GLib.Variant.new_string(handleToken),
              },
            ]),
            Gio.DBusCallFlags.NONE,
            -1,
            null,
            (source, result) => {
              try {
                const returnValue = source.call_finish(result);
                const requestHandle = returnValue
                  .get_child_value(0)
                  .get_string()[0];
                console.log(`Returned request handle: ${requestHandle}`);
              } catch (e) {
                console.error(`CreateSession call failed: ${e}`);
                GLib.source_remove(timeout);
                Gio.DBus.session.signal_unsubscribe(signalId);
                reject(e);
              }
            },
          );
        });

        console.log(`Session handle: ${this._sessionHandle}`);

        console.log("Calling BindShortcuts on proxy...");
        await new Promise((resolve, reject) => {
          this._globalShortcutsProxy.call(
            "BindShortcuts",
            new GLib.Variant("(oa(sa{sv})sa{sv})", [
              this._sessionHandle,
              [
                [
                  "show-window",
                  {
                    description: GLib.Variant.new_string("Show Kaya window"),
                    preferred_trigger:
                      GLib.Variant.new_string("CTRL+ALT+Return"),
                  },
                ],
              ],
              "",
              {},
            ]),
            Gio.DBusCallFlags.NONE,
            -1,
            null,
            (source, result) => {
              try {
                source.call_finish(result);
                resolve();
              } catch (e) {
                reject(e);
              }
            },
          );
        });

        console.log("Global shortcut Ctrl+Alt+Return registered successfully");
      } catch (e) {
        console.error("Failed to setup global shortcut:", e);
      }
    }

    _handleShortcutActivated(sessionHandle, shortcutId, timestamp, options) {
      console.log(`Shortcut activated: ${shortcutId}`);
      console.log(`Timestamp: ${timestamp}`);
      console.log(`Options type: ${typeof options}`);
      console.log(`Options: ${options}`);
      console.log(`Options stringified: ${JSON.stringify(options)}`);

      this.activate();
      const window = this.active_window;
      if (window) {
        let activationToken = null;

        if (options && typeof options === "object") {
          if (options.deepUnpack) {
            const optionsDict = options.deepUnpack();
            console.log(`Options dict: ${JSON.stringify(optionsDict)}`);
            const tokenVariant = optionsDict["activation_token"];
            if (tokenVariant) {
              activationToken = tokenVariant.deepUnpack
                ? tokenVariant.deepUnpack()
                : tokenVariant;
            }
          } else {
            console.log("Not using deepUnpack ... accessing options directly");
            activationToken = options["activation_token"];
            if (activationToken && activationToken.deepUnpack) {
              activationToken = activationToken.deepUnpack();
            }
          }
        }

        console.log(`Activation token: ${activationToken}`);
        if (activationToken) {
          console.log(`Setting startup ID: ${activationToken}`);
          window.set_startup_id(activationToken);
        } else {
          console.log(
            "No activation token available, portal backend may not support it yet",
          );
        }

        const useTimestamp = timestamp > 0 ? timestamp : Gdk.CURRENT_TIME;
        console.log(`Presenting window with time: ${useTimestamp}`);
        window.present_with_time(useTimestamp);
      }
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

      this._setupGlobalShortcut();

      return true;
    }
  },
);

export function main(argv) {
  const application = new KayaGnomeApplication();
  return application.runAsync(argv);
}
