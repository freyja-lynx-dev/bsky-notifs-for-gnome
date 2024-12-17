import GLib from "gi://GLib";
import Gio from "gi://Gio";
import Meta from "gi://Meta";
import Shell from "gi://Shell";
import Soup from "@girs/soup-3.0";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";
//import { XRPC, CredentialManager } from "@atcute/client";

export default class MyExtension extends Extension {
  gsettings?: Gio.Settings;
  identifier: string = "";
  appPassword: string = "";
  checkIntervalMinutes: number = 30;
  maxNotifications: number = 50;
  priorityNotifications: boolean = false;

  enable() {
    this.gsettings = this.getSettings();
    this.identifier = this.gsettings!.get_string("identifier");
    this.appPassword = this.gsettings!.get_string("apppassword");
    this.checkIntervalMinutes = this.gsettings!.get_int("checkintervalminutes");
    this.maxNotifications = this.gsettings!.get_int("maxnotifications");
    this.priorityNotifications = this.gsettings!.get_boolean(
      "prioritynotifications",
    );
  }

  disable() {
    this.gsettings = undefined;
  }
}