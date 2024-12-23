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
}
