import GLib from "gi://GLib";
import Gio from "gi://Gio";
import Meta from "gi://Meta";
import Shell from "gi://Shell";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";

export default class MyExtension extends Extension {
  gsettings?: Gio.Settings;
  testBool: boolean = true;

  enable() {
    this.gsettings = this.getSettings();
    this.testBool = this.gsettings!.get_value("test").deepUnpack() ?? 5;
  }

  disable() {
    this.gsettings = undefined;
  }
}
