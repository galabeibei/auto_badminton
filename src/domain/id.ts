/**
 * Lightweight id generator. Not cryptographically unique, but sufficient for
 * client-only, single-session identifiers (matches the original app's
 * behaviour so persisted/exported ids keep the same shape).
 */
export const generateUUID = (): string => Math.random().toString(36).substring(2, 15);
