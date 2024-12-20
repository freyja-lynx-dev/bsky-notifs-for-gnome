export let CLIENT_ID: string;
export let REDIRECT_URI: string;
export let STORAGE_NAME = "gnome-rest-oauth";
import Soup from "gi://Soup";
import GLib from "gi://GLib";
import Rest from "gi://Rest";
import { load_json_async } from "./api.js";

export const configureOauth = (options: ClientIDMetadata) => {};

// https://datatracker.ietf.org/doc/draft-parecki-oauth-client-id-metadata-document/
// https://atproto.com/specs/oauth
export interface ClientIDMetadata {
  client_id: string;
  application_type?: string;
  grant_types: string[];
  scope: string;
  response_types: string[];
  redirect_uris: string[];
  token_endpoint_auth_method?: string;
  token_endpoint_auth_signing_alg?: string;
  dpop_bound_access_tokens: boolean;
  jwks?: Array<any>; //TODO: implement JWK type
  jwks_uri?: string;
}

// https://atproto.com/specs/oauth#authorization-servers
// https://datatracker.ietf.org/doc/draft-ietf-oauth-resource-metadata/
export interface AuthServerMetadata {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  response_types_supported: string[];
  grant_types_supported: string[];
  code_challenge_methods_supported: string[];
  token_endpoint_auth_methods_supported: string[];
  scopes_supported: string[];
  authorization_response_iss_parameter_supported: boolean;
  require_pushed_authorization_requests: boolean;
  pushed_authorization_request_endpoint: string;
  dpop_signing_alg_values_supported: string[];
  require_request_uri_registration?: boolean;
  client_id_metadata_document_supported: boolean;
}
export function isAuthServerMetadata(obj: any): obj is AuthServerMetadata {
  return (
    obj.issuer !== undefined &&
    obj.authorization_endpoint !== undefined &&
    obj.token_endpoint !== undefined &&
    obj.response_types_supported !== undefined &&
    obj.grant_types_supported !== undefined &&
    obj.code_challenge_methods_supported !== undefined &&
    obj.token_endpoint_auth_methods_supported !== undefined &&
    obj.scopes_supported !== undefined &&
    obj.authorization_response_iss_parameter_supported !== undefined &&
    obj.require_pushed_authorization_requests !== undefined &&
    obj.pushed_authorization_request_endpoint !== undefined &&
    obj.dpop_signing_alg_values_supported !== undefined &&
    obj.client_id_metadata_document_supported !== undefined
  );
}

interface OauthProtectedResource {
  resource: string;
  authorization_servers: Array<string>;
  scopes_supported: Array<string>;
  bearer_methods_supported: Array<string>;
  resource_documentation: string;
}
export function isOauthProtectedResource(
  obj: any,
): obj is OauthProtectedResource {
  return (
    obj.resource !== undefined &&
    obj.authorization_servers !== undefined &&
    obj.scopes_supported !== undefined &&
    obj.bearer_methods_supported !== undefined &&
    obj.resource_documentation !== undefined
  );
}

async function getOauthProtectedResource(
  host: string,
  session: Soup.Session,
): Promise<OauthProtectedResource> {
  let msg: Soup.Message = Soup.Message.new(
    "GET",
    `${host}/.well-known/oauth-protected-resource`,
  );
  return new Promise((resolve, reject) => {
    load_json_async(
      session,
      msg,
      "getOauthProtectedResource",
      (data: any) => {
        if (!data.error && isOauthProtectedResource(data)) {
          resolve(data as OauthProtectedResource);
        } else {
          reject(data);
        }
      },
      [Soup.Status.OK],
    );
  });
}

export async function resolveOauthServerMetadata(
  host: string,
  session: Soup.Session,
): Promise<AuthServerMetadata> {
  const protectedResource = await getOauthProtectedResource(host, session);
  let msg: Soup.Message = Soup.Message.new(
    "GET",
    `${protectedResource.authorization_servers[0]}/.well-known/oauth-authorization-server`,
  );
  console.log(msg.get_uri());

  return new Promise((resolve, reject) => {
    load_json_async(
      session,
      msg,
      "resolveOauthServerData",
      (data: any) => {
        if (!data.error && isAuthServerMetadata(data)) {
          resolve(data as AuthServerMetadata);
        } else {
          reject(data);
        }
      },
      [Soup.Status.OK],
    );
  });
}
