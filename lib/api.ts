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
) {
  console.log("message: " + message.get_uri());
  session.send_and_read_async(
    message,
    GLib.PRIORITY_DEFAULT,
    null,
    (session, res) => {
      if (!responses.includes(message.get_status())) {
        throw new Error(
          "Unexpected response from " + context + "\n" + message.get_status(),
        );
      }
      let bytes = session!.send_and_read_finish(res);
      let decoder = new TextDecoder("utf-8");
      let response = decoder.decode(bytes.get_data()!);
      let data = JSON.parse(response);
      resolveFunc(data);
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
    );
  });
}

export function getAtprotoPdsFromService(didDoc: AT.DidDocument): string {
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
): Promise<AT.ComAtprotoServerCreateSession> {
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
        if (!data.error && AT.isComAtprotoServerCreateSession(data)) {
          resolve(data as AT.ComAtprotoServerCreateSession);
        } else {
          reject(data as AT.ResponseError);
        }
      },
      [Soup.Status.OK, Soup.Status.BAD_REQUEST, Soup.Status.UNAUTHORIZED],
    );
  });
}
