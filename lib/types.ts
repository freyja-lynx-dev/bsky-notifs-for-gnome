export type ComAtprotoIdentityResolveHandle = {
  did: string;
};
export function isComAtprotoIdentityResolveHandle(
  obj: any,
): obj is ComAtprotoIdentityResolveHandle {
  return obj.did !== undefined;
}

export type DidDocument = {
  id: string;
  alsoKnownAs: string[];
  verificationMethod: DidDocumentVerificationMethod[];
  service: DidDocumentService[];
};
export function isDidDocument(obj: any): obj is DidDocument {
  const hasId = obj.id !== undefined;
  const hasAlsoKnownAs = obj.alsoKnownAs !== undefined;
  const hasVerificationMethod = obj.verificationMethod !== undefined;
  let properVerificationMethods = false;
  obj.verificationMethod.forEach((verificationMethod: any) => {
    properVerificationMethods =
      isDidDocumentVerificationMethod(verificationMethod);
  });
  const hasService = obj.service !== undefined;
  let properServices = false;
  obj.service.forEach((service: any) => {
    properServices = isDidDocumentService(service);
  });
  return (
    hasId &&
    hasAlsoKnownAs &&
    hasVerificationMethod &&
    hasService &&
    properVerificationMethods &&
    properServices
  );
}

export type DidDocumentService = {
  id: string;
  type: string;
  serviceEndpoint: string;
};
function isDidDocumentService(obj: any): obj is DidDocumentService {
  const hasId = obj.id !== undefined;
  const hasType = obj.type !== undefined;
  const hasServiceEndpoint = obj.serviceEndpoint !== undefined;
  return hasId && hasType && hasServiceEndpoint;
}

export type DidDocumentVerificationMethod = {
  id: string;
  type: string;
  controller: string;
  publicKeyMultibase: string;
};
function isDidDocumentVerificationMethod(
  obj: any,
): obj is DidDocumentVerificationMethod {
  const hasId = obj.id !== undefined;
  const hasType = obj.type !== undefined;
  const hasController = obj.controller !== undefined;
  const hasPublicKeyMultibase = obj.publicKeyMultibase !== undefined;
  return hasId && hasType && hasController && hasPublicKeyMultibase;
}

export type AtprotoSession = {
  accessJwt: string;
  refreshJwt: string;
  handle: string;
  did: string;
  didDoc?: DidDocument;
  email?: string;
  emailConfirmed?: boolean;
  emailAuthFactor?: boolean;
  active?: boolean;
  status?: "takendown" | "suspended" | "deactivated";
};
export function isAtprotoSession(obj: any): obj is AtprotoSession {
  const hasAccessJwt = obj.accessJwt !== undefined;
  const hasRefreshJwt = obj.refreshJwt !== undefined;
  const hasHandle = obj.handle !== undefined;
  const hasDid = obj.did !== undefined;

  return hasAccessJwt && hasRefreshJwt && hasHandle && hasDid;
}

export type ResponseError = {
  error: string;
  message: string;
};
export function isComAtprotoError(obj: any): obj is ResponseError {
  const hasError = obj.error !== undefined;
  const hasMessage = obj.message !== undefined;

  return hasError && hasMessage;
}

export enum Notification {
  Like = "like",
  Repost = "repost",
  Follow = "follow",
  Mention = "mention",
  Reply = "reply",
  Quote = "quote",
  StarterpackJoined = "starterpack-joined",
}

export type AppBskyNotification = {
  uri: string; //at-uri
  cid: string; // cid
  author: object; // author obj
  reason: Notification;
  reasonSubject: string; //at-uri
  record: object;
  isRead: boolean;
  indexedAt: string; //date-time
  labels: object[];
};
export function isAppBskyNotification(obj: any): obj is AppBskyNotification {
  const hasUri = obj.uri !== undefined;
  const hasCid = obj.cid !== undefined;
  const hasAuthor = obj.author !== undefined;
  const hasReason = obj.reason !== undefined;
  const hasReasonSubject = obj.reasonSubject !== undefined;
  const hasRecord = obj.record !== undefined;
  const hasIsRead = obj.isRead !== undefined;
  const hasIndexedAt = obj.indexedAt !== undefined;
  const hasLabels = obj.labels !== undefined;
  return (
    hasUri &&
    hasCid &&
    hasAuthor &&
    hasReason &&
    hasReasonSubject &&
    hasRecord &&
    hasIsRead &&
    hasIndexedAt &&
    hasLabels
  );
}

export type AppBskyNotificationListNotifications = {
  cursor: string;
  notifications: AppBskyNotification[];
  priority: boolean;
  seenAt: string; //date-time
};
export function isAppBskyNotificationListNotifications(
  obj: any,
): obj is AppBskyNotificationListNotifications {
  const hasCursor = obj.cursor !== undefined;
  const hasNotifications = obj.notifications !== undefined;
  const hasPriority = obj.priority !== undefined;
  const hasSeenAt = obj.seenAt !== undefined;

  return hasCursor && hasNotifications && hasPriority && hasSeenAt;
}

export type AppBskyAuthToken = {
  token: string;
};
export function isAppBskyAuthToken(obj: any): obj is AppBskyAuthToken {
  return obj.token !== undefined;
}
