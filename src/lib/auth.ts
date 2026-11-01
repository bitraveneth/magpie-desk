import { createHmac, timingSafeEqual } from "node:crypto";

export const sessionCookieName = "magpie_desk";
export const sessionMaxAge = 60 * 60 * 24 * 14;

function secret(): string {
  const value = process.env.SESSION_SECRET ?? "";
  if (value.length < 16) {
    throw new Error("SESSION_SECRET must be at least 16 characters.");
  }
  return value;
}

function sameText(left: string, right: string): boolean {
  const leftBytes = Buffer.from(left);
  const rightBytes = Buffer.from(right);
  if (leftBytes.length !== rightBytes.length) return false;
  return timingSafeEqual(leftBytes, rightBytes);
}

export function credentialsMatch(username: string, password: string): boolean {
  const expectedUser = process.env.ADMIN_USERNAME ?? "";
  const expectedPassword = process.env.ADMIN_PASSWORD ?? "";
  if (!expectedUser || !expectedPassword) return false;
  return sameText(username, expectedUser) && sameText(password, expectedPassword);
}

export function sessionToken(): string {
  const expires = Date.now() + sessionMaxAge * 1000;
  const body = `v1.${expires}`;
  const signature = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${signature}`;
}

export function sessionValid(token: string | undefined): boolean {
  if (!token) return false;
  const secretValue = process.env.SESSION_SECRET ?? "";
  if (secretValue.length < 16) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [version, expires, signature] = parts;
  if (version !== "v1") return false;
  const expected = createHmac("sha256", secretValue).update(`${version}.${expires}`).digest("base64url");
  if (!sameText(signature, expected)) return false;
  return Number(expires) > Date.now();
}

export function safeNextPath(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\") || value.includes("://")) {
    return "/";
  }
  if (value.startsWith("/login")) return "/";
  return value;
}
