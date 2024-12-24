import Gio from "gi://Gio";
import GLib from "gi://GLib";
import Soup from "gi://Soup";
import St from "gi://St";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";
import * as MessageTray from "resource:///org/gnome/shell/ui/messageTray.js";
import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";
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
  didDocument: AT.DidDocument | undefined = {
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
  baseurl: string | undefined = "";
  atprotoSession: any;
  _indicator: any;
  cursor: string = "";
  notificationSource: any = null;
  getNotificationSource(): any {
    if (!this.notificationSource) {
      // we should make our own notification policy obj but for now default
      this.notificationSource = new MessageTray.Source({
        title: "Bluesky",
        icon: new Gio.ThemedIcon({ name: "application-rss+xml-symbolic" }),
        iconName: "application-rss+xml-symbolic",
      });
      this.notificationSource.connect("destroy", () => {
        this.notificationSource = null;
      });
      Main.messageTray.add(this.notificationSource);
    }
    return this.notificationSource;
  }
  makeNotifTitle(record: AT.AppBskyNotification): string {
    const reasonMap = new Map([
      ["like", "liked your post"],
      ["repost", "reskeeted your post"],
      ["follow", "followed you"],
      ["mention", "tagged you in a post"],
      ["reply", "replied to your post"],
      ["quote", "quoted your post"],
      ["starterpack-joined", "joined your starter pack"],
    ]);
    const author = record.author as AT.AppBskyAuthor;

    return `${author.handle} ${reasonMap.get(record.reason)}`;
  }
  async makeNotifBody(
    record: AT.AppBskyNotification,
    session: Soup.Session,
  ): Promise<string> {
    const recordRecord = record.record as AT.AppBskyNotifRecord;
    const post: AT.ComAtprotoRepoGetRecord = await API.getRecord(
      record.reasonSubject.split("/")[2],
      record.reasonSubject.split("/")[3],
      record.reasonSubject.split("/")[4],
      session,
    );

    if (!(post.value as AT.PostRecord).text) {
      return `${record.reasonSubject}`;
    } else {
      return (post.value as AT.PostRecord).text;
    }
  }
  async makeNotification(
    record: AT.AppBskyNotification,
    session: Soup.Session,
  ): Promise<MessageTray.Notification> {
    const notification = new MessageTray.Notification({
      source: this.getNotificationSource(),
      title: this.makeNotifTitle(record),
      body: await this.makeNotifBody(record, session),
      gicon: new Gio.ThemedIcon({ name: "application-rss+xml-symbolic" }),
      iconName: "application-rss+xml-symbolic",
      urgency: MessageTray.Urgency.NORMAL,
    });
    notification.connect("destroy", (_notification, reason) => {
      if (reason === MessageTray.NotificationDestroyedReason.DISMISSED) {
        console.debug("user dismissed notification");
      }
    });
    notification.connect("activated", (_notification) => {
      // open the record in the browser
      // this just uses the at:// syntax -- probably doesn't work by default
      // just proof of concept
      GLib.spawn_command_line_async(`xdg-open ${record.reasonSubject}`);
    });
    return notification;
  }

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
    // console.log("this.did: " + this.did);
    // resolve DID to DID document to obtain PDS
    await API.getDidDocument(this.did, session)
      .then((didDocObj) => {
        this.didDocument = didDocObj;
        this.pds = API.getAtprotoPds(didDocObj);
      })
      .catch((error) => {
        throw new Error("getDidDocument error: " + JSON.stringify(error));
      });
    // console.log("didDocument: " + JSON.stringify(this.didDocument));
    // console.log("pds: " + this.pds);
    // create ATPSession
    const authServer = (
      await OAuth.getOauthProtectedResource(this.pds, session)
    ).authorization_servers[0];
    // console.log("authServer: " + authServer);
    this.atprotoSession = new NotifsAgent();
    await this.atprotoSession.login(
      authServer,
      session,
      this.identifier,
      this.appPassword,
    );
    console.log("bsky-notifs-for-gnome: successfully created session");
    // console.log(JSON.stringify(this.atprotoSession.session));

    this.gsettings.connect(
      "changed::maxnotifications",
      async (settings, key) => {
        this.maxNotifications = settings.get_int(key);
        console.log("maxNotifications: " + this.maxNotifications);
      },
    );

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
    this._indicator = new PanelMenu.Button(0.0, "Bluesky Notifs", false);
    const icon = new St.Icon({
      icon_name: "application-rss+xml-symbolic",
      style_class: "system-status-icon",
    });
    this._indicator.add_child(icon);
    Main.panel.addToStatusArea(this.uuid, this._indicator);

    // get notifications from PDS
    this._indicator.connect("button-press-event", async () => {
      console.log("bsky-notifs-for-gnome: pulling notifications");
      const authToken = await API.getServiceAuth(
        authServer,
        session,
        this.atprotoSession.session.accessJwt,
        {
          aud: this.did,
          lxm: "com.atproto.server.listNotifications",
        },
      );
      await API.listNotifications(
        authServer,
        session,
        this.atprotoSession.session.accessJwt,
        {
          limit: this.maxNotifications,
          priority: this.priorityNotifications,
          cursor: this.cursor,
          seenAt: "",
        },
      )
        .then((notifications: AT.AppBskyNotificationListNotifications) => {
          console.log("bsky-notifs-for-gnome: got notifications");
          console.log(JSON.stringify(notifications));
          // send notifications to Gnome Shell
          Main.messageTray.add(this.getNotificationSource());
          notifications.notifications
            .slice(0, this.maxNotifications)
            .forEach((n: AT.AppBskyNotification) => {
              this.makeNotification(n, session)
                .then((notification: MessageTray.Notification) => {
                  this.notificationSource.addNotification(notification);
                })
                .catch((error: AT.ResponseError) => {
                  console.log(
                    `bsky-notifs-for-gnome error: ${JSON.stringify(error)}`,
                  );
                });
            });
        })
        .catch((error: AT.ResponseError) => {
          console.log(`bsky-notifs-for-gnome error: ${JSON.stringify(error)}`);
        });
      // await this.atprotoSession
      //   .listNotifications(authServer, session, {
      //     limit: this.maxNotifications,
      //     priority: this.priorityNotifications,
      //     cursor: this.cursor,
      //     seenAt: "",
      //   })
      //   .then((notifications: AT.AppBskyNotificationListNotifications) => {
      //     console.log("bsky-notifs-for-gnome: got notifications");
      //     console.log(JSON.stringify(notifications));
      //     // send notifications to Gnome Shell
      //   })
      //   .catch((error: AT.ResponseError) => {
      //     console.log(`bsky-notifs-for-gnome error: ${JSON.stringify(error)}`);
      //   });
    });
  }

  disable() {
    this.gsettings = undefined;
    this.atprotoSession = undefined;
    this._indicator?.destroy();
    this._indicator = undefined;
    this.notificationSource?.destroy();
    this.atprotoSession = undefined;
    this.didDocument = undefined;
  }
}
