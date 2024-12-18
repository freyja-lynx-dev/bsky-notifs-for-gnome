import GLib from "gi://GLib";
import Gio from "gi://Gio";
import Meta from "gi://Meta";
import Shell from "gi://Shell";
import Soup from "gi://Soup";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";
import * as API from "./api.js";

export default class BlueskyNotifsForGnome extends Extension {
  gsettings?: Gio.Settings;
  identifier: string = "";
  appPassword: string = "";
  checkIntervalMinutes: number = 30;
  maxNotifications: number = 50;
  priorityNotifications: boolean = false;
  did: string = "";
  didDocument: object = {};

  enable() {
    this.gsettings = this.getSettings();
    this.identifier = this.gsettings!.get_string("identifier");
    this.appPassword = this.gsettings!.get_string("apppassword");
    this.checkIntervalMinutes = this.gsettings!.get_int("checkintervalminutes");
    this.maxNotifications = this.gsettings!.get_int("maxnotifications");
    this.priorityNotifications = this.gsettings!.get_boolean(
      "prioritynotifications",
    );
    const session = new Soup.Session();

    // resolve handle to DID
    API.resolveHandleToDid(this.identifier, session)
      .then((didObj) => {
        if (API.isComAtprotoIdentityResolveHandle(didObj)) {
          this.did = didObj.did;
        }
      })
      .catch((error) => {
        console.log(error);
      });
    console.log("this.did: " + this.did);
    // resolve DID to DID document to obtain PDS
    API.getDidDocument(this.did, session)
      .then((didDocObj) => {
        if (API.isDidDocument(didDocObj)) {
          this.didDocument = didDocObj;
        }
      })
      .catch((error) => {
        console.log(error);
      });
    // get auth token from PDS
    // get notifications from PDS
  }

  disable() {
    this.gsettings = undefined;
  }
}
