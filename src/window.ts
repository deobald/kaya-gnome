/* window.js
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

import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk';
import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

export const KayaGnomeWindow = GObject.registerClass({
    GTypeName: 'KayaGnomeWindow',
    Template: 'resource:///ca/deobald/Kaya/window.ui',
    InternalChildren: ['main_text_view', 'open_button'],
}, class KayaGnomeWindow extends Adw.ApplicationWindow {
    constructor(application) {
        super({ application });

        const openAction = new Gio.SimpleAction({name: 'open'});
        openAction.connect('activate', () => this.openFileDialog());
        this.add_action(openAction);
    }

    openFileDialog() {
        // Create a new file selection dialog
        const fileDialog = new Gtk.FileDialog();

        // Open the dialog and handle user's selection
        fileDialog.open(this, null, async (self, result) => {
          try {
             const file = self.open_finish(result);

             if (file) {
                   await this.openFile(file); // We will define this method soon
             }
          } catch(_) {
             // user closed the dialog without selecting any file
          }
        });
    }

    async openFile(file) {
        // Get the name of the file
        let fileName;
        try {
            const fileInfo = file.query_info("standard::display-name", FileQueryInfoFlags.NONE);
            fileName = fileInfo.get_attribute_string("standard::display-name");
        } catch(_) {
            fileName = file.get_basename();
        }

        let contentsBytes;
        try {
            // Retrieve contents asynchronously
            // The first index of the returned array contains a byte
            // array of the contents
            contentsBytes = (await file.load_contents_async(null))[0];
        } catch (e) {
            logError(e, `Unable to open ${file.peek_path()}`);
            return;
        }
        if (!GLib.utf8_validate(contentsBytes)) {
            logError(`Invalid text encoding for ${file.peek_path()}`);
            return;
        }

        // Convert a UTF-8 bytes array into a String
        const contentsText = new TextDecoder('utf-8').decode(contentsBytes);

        // Retrieve the GtkTextBuffer instance that stores the
        // text displayed by the GtkTextView widget
        const buffer = this._main_text_view.buffer;

        // Set the text using the contents of the file
        buffer.text = contentsText;

        // Reposition the cursor so it's at the start of the text
        const startIterator = buffer.get_start_iter();
        buffer.place_cursor(startIterator);

        // Set the window title using the loaded file's name
        this.title = fileName;
    }

});

