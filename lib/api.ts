import Soup from "gi://Soup?version=3.0";
import GLib from "gi://GLib";
import Gio from "gi://Gio";
import * as AT from "./types.js";

// this function gets the job done, but is not capable of giving
// rich context to a failed message -- i should refactor this sometime
// to change `responses` to `validityFunction` and allow callers to
// provide a contextful validity check without needing this function
// to be super complicated
export function load_json_async(
  session: Soup.Session,
  message: Soup.Message,
  context: String,
  resolveFunc: Function,
  responses: Array<Soup.Status>,
  responsesWithData: Array<Soup.Status>,
) {
  session.send_and_read_async(
    message,
    GLib.PRIORITY_DEFAULT,
    null,
    (session, res) => {
      if (!responses.includes(message.get_status())) {
        throw new Error(
          `${context} unexpected response: ${message.get_status()}`,
        );
      }
      if (responsesWithData.includes(message.get_status())) {
        let bytes = session!.send_and_read_finish(res);
        let decoder = new TextDecoder("utf-8");
        let response = decoder.decode(bytes.get_data()!);
        let data = JSON.parse(response);
        //console.log("data: " + JSON.stringify(data));
        resolveFunc(data);
      } else {
        session!.send_and_read_finish(res);
      }
    },
  );
}

// https://docs.bsky.app/docs/api/com-atproto-identity-resolve-handle
export async function resolveHandleToDid(
  handle: string,
  session: Soup.Session,
): Promise<AT.ComAtprotoIdentityResolveHandle> {
  const params = {
    handle: handle,
  };
  const message: Soup.Message = Soup.Message.new_from_encoded_form(
    "GET",
    "https://bsky.social/xrpc/com.atproto.identity.resolveHandle",
    Soup.form_encode_hash(params),
  );
  return new Promise((resolve, reject) => {
    load_json_async(
      session,
      message,
      "com.atproto.identity.resolveHandle",
      (data: any) => {
        console.log(data);
        if (!data.error && AT.isComAtprotoIdentityResolveHandle(data)) {
          resolve(data as AT.ComAtprotoIdentityResolveHandle);
        } else {
          reject(data);
        }
      },
      [Soup.Status.OK, Soup.Status.BAD_REQUEST, Soup.Status.UNAUTHORIZED],
      [Soup.Status.OK, Soup.Status.BAD_REQUEST, Soup.Status.UNAUTHORIZED],
    );
  });
}
// https://web.plc.directory/api/redoc
// https://w3c-ccg.github.io/did-method-web/#key-material-and-document-handling
export async function getDidDocument(
  did: string,
  session: Soup.Session,
): Promise<AT.DidDocument> {
  const message: Soup.Message = Soup.Message.new(
    "GET",
    did.startsWith("did:web")
      ? `https://${did.split(":")[2]}/.well-known/did.json`
      : "https://plc.directory/" + did,
  );
  return new Promise((resolve, reject) => {
    load_json_async(
      session,
      message,
      "getDidDocument",
      (data: any) => {
        if (!data.error && AT.isDidDocument(data)) {
          resolve(data as AT.DidDocument);
        } else {
          reject(data);
        }
      },
      [Soup.Status.OK, Soup.Status.NOT_FOUND, Soup.Status.GONE],
      [Soup.Status.OK, Soup.Status.NOT_FOUND, Soup.Status.GONE],
    );
  });
}

export function getAtprotoPds(didDoc: AT.DidDocument): string {
  const service = didDoc.service.filter(
    (service: AT.DidDocumentService) => service.id === "#atproto_pds",
  );
  if (service.length == 1) {
    return service[0].serviceEndpoint;
  } else {
    throw new Error("No ATProtocol PDS found in DID document");
  }
}

//https://docs.bsky.app/docs/api/com-atproto-server-create-session
export async function createSession(
  server: string,
  session: Soup.Session,
  handle: string,
  pass: string,
): Promise<AT.AtprotoSession> {
  const params = `{"identifier":"${handle}","password":"${pass}"}`;
  const message: Soup.Message = Soup.Message.new(
    "POST",
    server + "/xrpc/com.atproto.server.createSession",
  );
  const encoder = new TextEncoder();
  message.set_request_body_from_bytes(
    "application/json",
    GLib.Bytes.new(encoder.encode(params)),
  );

  return new Promise((resolve, reject) => {
    load_json_async(
      session,
      message,
      "createSession",
      (data: any) => {
        if (!data.error && AT.isAtprotoSession(data)) {
          resolve(data as AT.AtprotoSession);
        } else {
          reject(data as AT.ResponseError);
        }
      },
      [Soup.Status.OK, Soup.Status.BAD_REQUEST, Soup.Status.UNAUTHORIZED],
      [Soup.Status.OK, Soup.Status.BAD_REQUEST, Soup.Status.UNAUTHORIZED],
    );
  });
}
export async function getServiceAuth(
  server: string,
  session: Soup.Session,
  accessJwt: string,
  params: object,
): Promise<AT.AppBskyAuthToken> {
  const message: Soup.Message = Soup.Message.new_from_encoded_form(
    "GET",
    server + "/xrpc/com.atproto.server.getServiceAuth",
    Soup.form_encode_hash(params),
  );
  message.requestHeaders.append("authorization", `Bearer ${accessJwt}`);
  return new Promise((resolve, reject) => {
    load_json_async(
      session,
      message,
      "getServiceAuth",
      (data: any) => {
        if (!data.error && AT.isAppBskyAuthToken(data)) {
          resolve(data as AT.AppBskyAuthToken);
        } else {
          reject(data as AT.ResponseError);
        }
      },
      [Soup.Status.OK, Soup.Status.BAD_REQUEST, Soup.Status.UNAUTHORIZED],
      [Soup.Status.OK, Soup.Status.BAD_REQUEST, Soup.Status.UNAUTHORIZED],
    );
  });
}

export async function listNotifications(
  server: string,
  session: Soup.Session,
  accessJwt: string,
  params: object,
): Promise<AT.AppBskyNotificationListNotifications> {
  const message: Soup.Message = Soup.Message.new(
    "GET",
    server + "/xrpc/app.bsky.notification.listNotifications",
  );
  message.requestHeaders.append("authorization", `Bearer ${accessJwt}`);
  const encoder = new TextEncoder();
  message.set_request_body_from_bytes(
    "application/json",
    GLib.Bytes.new(encoder.encode(JSON.stringify(params))),
  );
  return new Promise((resolve, reject) => {
    load_json_async(
      session,
      message,
      "listNotifications",
      (data: any) => {
        if (
          !data.error /*&& AT.isAppBskyNotificationListNotifications(data)*/
        ) {
          console.warn("listNotifications data: " + JSON.stringify(data));
          resolve(data as AT.AppBskyNotificationListNotifications);
        } else {
          reject(data as AT.ResponseError);
        }
      },
      [Soup.Status.OK, Soup.Status.BAD_REQUEST, Soup.Status.UNAUTHORIZED],
      [Soup.Status.OK, Soup.Status.BAD_REQUEST, Soup.Status.UNAUTHORIZED],
    );
  });
}

export async function putPreferences(
  server: string,
  session: Soup.Session,
  accessJwt: string,
  prefs: object,
) {
  const message: Soup.Message = Soup.Message.new(
    "POST",
    server + "/xrpc/app.bsky.notification.putPreferences",
  );
  const encoder = new TextEncoder();
  message.requestHeaders.append("authorization", `Bearer ${accessJwt}`);
  message.set_request_body_from_bytes(
    "application/json",
    GLib.Bytes.new(encoder.encode(JSON.stringify(prefs))),
  );
  return new Promise((resolve, reject) => {
    load_json_async(
      session,
      message,
      "putPreferences",
      (data: any) => {
        if (!data.error) {
          resolve(data);
        } else {
          reject(data);
        }
      },
      [Soup.Status.OK, Soup.Status.BAD_REQUEST, Soup.Status.UNAUTHORIZED],
      [Soup.Status.BAD_REQUEST, Soup.Status.UNAUTHORIZED],
    );
  });
}

export async function getRecord(
  did: string,
  collection: string,
  rkey: string,
  session: Soup.Session,
): Promise<AT.ComAtprotoRepoGetRecord> {
  const message: Soup.Message = Soup.Message.new_from_encoded_form(
    "GET",
    "https://bsky.social/xrpc/com.atproto.repo.getRecord",
    Soup.form_encode_hash({
      repo: did,
      collection: collection,
      rkey: rkey,
    }),
  );
  return new Promise((resolve, reject) => {
    load_json_async(
      session,
      message,
      "getRecord",
      (data: any) => {
        if (!data.error && AT.isComAtprotoRepoGetRecord(data)) {
          resolve(data as AT.ComAtprotoRepoGetRecord);
        } else {
          reject(data as AT.ResponseError);
        }
      },
      [Soup.Status.OK, Soup.Status.BAD_REQUEST, Soup.Status.UNAUTHORIZED],
      [Soup.Status.OK, Soup.Status.BAD_REQUEST, Soup.Status.UNAUTHORIZED],
    );
  });
}
