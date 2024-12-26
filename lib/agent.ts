import * as AT from "./types.js";
import * as API from "./api.js";
import Soup from "gi://Soup?version=3.0";

export class NotifsAgent {
  session: AT.AtprotoSession | undefined = undefined;
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
  async logout(server: string, session: Soup.Session): Promise<void> {
    await API.deleteSession(server, session, this.session!.accessJwt)
      .then(() => {
        console.log("agent::logout success");
        this.session = undefined;
      })
      .catch((error: AT.ResponseError) => {
        console.log("agent::logout error: " + JSON.stringify(error));
      });
  }
  async putPreferences(
    server: string,
    session: Soup.Session,
    priority: boolean,
  ): Promise<void> {
    await API.putPreferences(server, session, this.session!.accessJwt, {
      priority: priority,
    }).catch((error: AT.ResponseError) => {
      console.log(priority);
      console.log("agent::putPreferences error: " + JSON.stringify(error));
    });
  }
  async listNotifications(
    server: string,
    session: Soup.Session,
    params: object,
  ): Promise<AT.AppBskyNotificationListNotifications> {
    return await API.listNotifications(
      server,
      session,
      this.session!.accessJwt,
      params,
    ).catch((error: AT.ResponseError) => {
      throw new Error("listNotifications error: " + JSON.stringify(error));
    });
  }
}
