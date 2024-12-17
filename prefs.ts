import Gtk from "gi://Gtk";
import Adw from "gi://Adw";
import Gio from "gi://Gio";
import {
  ExtensionPreferences,
  gettext as _,
} from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";
import { MaxWidthBox } from "resource:///org/gnome/shell/ui/search.js";

export default class GnomeRectanglePreferences extends ExtensionPreferences {
  _settings?: Gio.Settings;

  fillPreferencesWindow(window: Adw.PreferencesWindow): Promise<void> {
    this._settings = this.getSettings();

    const page = new Adw.PreferencesPage({
      title: _("General"),
      iconName: "dialog-information-symbolic",
    });

    const mainGroup = new Adw.PreferencesGroup({
      title: _("Notification Settings"),
      description: _("Settings for Bluesky Notifications"),
    });
    page.add(mainGroup);

    const maxNotifications = new Adw.SpinRow({
      title: _("Notifications to Show"),
      subtitle: _("How many notifications to show at once"),
      adjustment: new Gtk.Adjustment({
        lower: 0,
        upper: 100,
        stepIncrement: 1,
      }),
    });
    mainGroup.add(maxNotifications);
    const checkIntervalMinutes = new Adw.SpinRow({
      title: _("Check Interval"),
      subtitle: _("How frequently to check for new notifications"),
      adjustment: new Gtk.Adjustment({
        lower: 0,
        upper: 1440,
        stepIncrement: 1,
      }),
    });
    mainGroup.add(checkIntervalMinutes);

    const identifier = new Adw.EntryRow({
      title: _("Bluesky Identifier"),
    });
    mainGroup.add(identifier);

    const appPassword = new Adw.EntryRow({
      title: _("Bluesky App Password"),
    });
    mainGroup.add(appPassword);

    const priorityNotifications = new Adw.SwitchRow({
      title: _("Priority Notifications"),
      subtitle: _(
        "When enabled, you will only receive reply and quote notifications from users you follow.",
      ),
    });
    mainGroup.add(priorityNotifications);

    window.add(page);

    this._settings!.bind(
      "maxnotifications",
      maxNotifications,
      "value",
      Gio.SettingsBindFlags.DEFAULT,
    );
    this._settings!.bind(
      "checkintervalminutes",
      checkIntervalMinutes,
      "value",
      Gio.SettingsBindFlags.DEFAULT,
    );
    this._settings!.bind(
      "identifier",
      identifier,
      "text",
      Gio.SettingsBindFlags.DEFAULT,
    );
    this._settings!.bind(
      "apppassword",
      appPassword,
      "text",
      Gio.SettingsBindFlags.DEFAULT,
    );
    this._settings!.bind(
      "prioritynotifications",
      priorityNotifications,
      "active",
      Gio.SettingsBindFlags.DEFAULT,
    );
    return Promise.resolve();
  }
}
