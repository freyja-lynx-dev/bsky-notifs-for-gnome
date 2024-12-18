import Soup from "gi://Soup?version=3.0";
import GLib from "gi://GLib";
import Gio from "gi://Gio";
import * as AT from "./types.js";

function load_json_async(
  session: Soup.Session,
  message: Soup.Message,
  context: String,
  resolveFunc: Function,
  responses: Array<Soup.Status>,
) {
  session.send_and_read_async(
    message,
    GLib.PRIORITY_DEFAULT,
    null,
    (session, res) => {
      if (!responses.includes(message.get_status())) {
        throw new Error("Unexpected response from " + context);
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
export async function getDidDocument(
  did: string,
  session: Soup.Session,
): Promise<AT.DidDocument> {
  const message: Soup.Message = Soup.Message.new(
    "GET",
    "https://plc.directory/" + did,
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
