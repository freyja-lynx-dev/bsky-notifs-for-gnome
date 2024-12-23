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
import { NotifsAgent } from "./lib/agent.js";

// function checkDepdendencies() {
//   const proc = Gio.Subprocess.new(
//     "./jwt-generator.py --dry-run"
//   )
// }

// OAuth is not going to be implemented yet but the work we have already isn't going to be list
// async function OAuthFlow() {
//   // get oauth metadata from PDS's authorization server
//   const metadata = await OAuth.resolveOauthServerMetadata(this.pds, session);
//   console.log("metadata: " + JSON.stringify(metadata));
//   // authorization flow
// }

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
  atprotoSession: any;

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
        throw new Error("resolveHandleToDid error: " + JSON.stringify(error));
      });
    console.log("this.did: " + this.did);
    // resolve DID to DID document to obtain PDS
    await API.getDidDocument(this.did, session)
      .then((didDocObj) => {
        this.didDocument = didDocObj;
        this.pds = API.getAtprotoPds(didDocObj);
      })
      .catch((error) => {
        throw new Error("getDidDocument error: " + JSON.stringify(error));
      });
    console.log("didDocument: " + JSON.stringify(this.didDocument));
    console.log("pds: " + this.pds);
    // create ATPSession
    const authServer = (
      await OAuth.getOauthProtectedResource(this.pds, session)
    ).authorization_servers[0];
    console.log("authServer: " + authServer);
    this.atprotoSession = new NotifsAgent();
    await this.atprotoSession.login(
      authServer,
      session,
      this.identifier,
      this.appPassword,
    );
    console.log(JSON.stringify(this.atprotoSession.session));

    this.gsettings.connect(
      "changed::prioritynotifications",
      async (settings, key) => {
        await this.atprotoSession
          .putPreferences(authServer, session, settings.get_boolean(key))
          .catch((error: Soup.Status) => {
            console.log("putPreferences error: " + error);
          });
      },
    );
    // let atpSession = await API.createSession(
    //   authServer,
    //   session,
    //   this.identifier,
    //   this.appPassword,
    // ).catch((error) => {
    //   throw new Error("createSession error: " + JSON.stringify(error));
    // });
    // get notifications from PDS
    // send notifications to Gnome Shell
  }

  disable() {
    this.gsettings = undefined;
    this.atprotoSession = undefined;
  }
}
