import GLib from "gi://GLib";
import Gio from "gi://Gio";
import Meta from "gi://Meta";
import Shell from "gi://Shell";
import Soup from "gi://Soup";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";
import * as API from "./lib/api.js";
import * as AT from "./lib/types.js";
import * as OAuth from "./lib/oauth.js";

export default class BlueskyNotifsForGnome extends Extension {
  gsettings?: Gio.Settings;
  identifier: string = "";
  appPassword: string = "";
  checkIntervalMinutes: number = 30;
  maxNotifications: number = 50;
  priorityNotifications: boolean = false;
  did: string = "";
  didDocument: AT.DidDocument = {
    id: "",
    alsoKnownAs: Array<string>(),
    verificationMethod: Array<AT.DidDocumentVerificationMethod>(),
    service: Array<AT.DidDocumentService>(),
  };
  // these should proably have real typed verification rather than just strings
  pds: string = "";
  authurl: string = "";
  tokenurl: string = "";
  redirecturl: string = "";
  baseurl: string = "";

  async enable() {
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
    await API.resolveHandleToDid(this.identifier, session)
      .then((didObj) => {
        this.did = didObj.did;
      })
      .catch((error) => {
        console.log(error);
      });
    console.log("this.did: " + this.did);
    // resolve DID to DID document to obtain PDS
    await API.getDidDocument(this.did, session)
      .then((didDocObj) => {
        this.didDocument = didDocObj;
        // we're just assuming the first one is the correct one
        // not really sure if you'll ever get multiple? or what that means?
        this.pds = didDocObj.service[0].serviceEndpoint;
      })
      .catch((error) => {
        console.log(error);
      });
    console.log("didDocument: " + JSON.stringify(this.didDocument));
    console.log("pds: " + this.pds);
    // oauth2 stuff
    const metadata = await OAuth.resolveOauthServerMetadata(this.pds, session);
    console.log("metadata: " + JSON.stringify(metadata));
    // get notifications from PDS
    // send notifications to Gnome Shell
  }

  disable() {
    this.gsettings = undefined;
  }
}
