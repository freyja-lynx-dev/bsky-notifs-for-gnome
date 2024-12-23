import * as AT from "./types.js";
import * as API from "./api.js";
import Soup from "gi://Soup?version=3.0";

export class NotifsAgent {
  session: any = undefined;
  async login(
    server: string,
    session: Soup.Session,
    handle: string,
    pass: string,
  ): Promise<void> {
    await API.createSession(server, session, handle, pass).then(
      (session: AT.AtprotoSession) => {
        this.session = session;
      },
      (error: AT.ResponseError) => {
        throw new Error("createSession error: " + JSON.stringify(error));
      },
    );
  }
  async putPreferences(
    server: string,
    session: Soup.Session,
    priority: boolean,
  ): Promise<void> {
    await API.putPreferences(server, session, this.session.accessJwt, {
      priority: priority,
    }).catch((error: AT.ResponseError) => {
      console.log(priority);
      console.log("agent::putPreferences error: " + JSON.stringify(error));
    });
  }
  // async getNotifications( server: string,
  //   session: Soup.Session,
  //   handle: string,
  //   pass: string,
  //   cursor: string,
  // ): Promise<AT.AppBskyNotificationListNotifications> {
  //   return await API.getNotifications(
  //     server,
  //     this.session,
  //     this.session.handle,
  //     this.session.accessJwt,
  //     cursor,
  //   ).catch((error: AT.ResponseError) => {
  //     throw new Error("getNotifications error: " + JSON.stringify(error));
  //   });
  // }
}
