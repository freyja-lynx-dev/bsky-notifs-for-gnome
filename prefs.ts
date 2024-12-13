import Gtk from "gi://Gtk";
import Adw from "gi://Adw";
import Gio from "gi://Gio";
import {
  ExtensionPreferences,
  gettext as _,
} from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";

export default class GnomeRectanglePreferences extends ExtensionPreferences {
  _settings?: Gio.Settings;

  fillPreferencesWindow(window: Adw.PreferencesWindow): Promise<void> {
    this._settings = this.getSettings();

    const page = new Adw.PreferencesPage({
      title: _("General"),
      iconName: "dialog-information-symbolic",
    });

    const testGroup = new Adw.PreferencesGroup({
      title: _("testing"),
      description: _("testing basic prefs"),
    });
    page.add(testGroup);

    const testTest = new Adw.SpinRow({
      title: _("test integer"),
      subtitle: _("funny number"),
      adjustment: new Gtk.Adjustment({
        lower: 0,
        upper: 100,
        stepIncrement: 1,
      }),
    });
    testGroup.add(testTest);

    window.add(page);

    this._settings!.bind(
      "test",
      testTest,
      "value",
      Gio.SettingsBindFlags.DEFAULT,
    );
    return Promise.resolve();
  }
}
