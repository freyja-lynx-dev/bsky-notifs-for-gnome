import Soup from "gi://Soup?version=3.0";
import GLib from "gi://GLib";
import Gio from "gi://Gio";

function load_json_async(
  session: Soup.Session,
  message: Soup.Message,
  context: String,
  resolveFunc: Function,
) {
  session.send_and_read_async(
    message,
    GLib.PRIORITY_DEFAULT,
    null,
    (session, res) => {
      if (message.get_status() !== Soup.Status.OK) {
        throw new Error("Failed to query server: " + context);
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
interface comAtprotoIdentityResolveHandle {
  did: string;
}
export function isComAtprotoIdentityResolveHandle(
  obj: any,
): obj is comAtprotoIdentityResolveHandle {
  return obj.did !== undefined;
}
export function resolveHandleToDid(
  handle: string,
  session: Soup.Session,
): Promise<JSON> {
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
        if (!data.error) {
          resolve(data);
        } else {
          reject(data);
        }
      },
    );
  });
}
