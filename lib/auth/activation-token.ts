import { createHash, randomBytes } from "crypto";
import { ACTIVATION_TOKEN_TTL_MS } from "@/lib/auth/constants";

export function generateActivationToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashActivationToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

export function getActivationExpiry(from: Date = new Date()): Date {
  return new Date(from.getTime() + ACTIVATION_TOKEN_TTL_MS);
}

export function buildActivationUrl(rawToken: string): string {
  const baseUrl = process.env.NEXTAUTH_URL?.replace(/\/$/, "");
  if (!baseUrl) {
    throw new Error("NEXTAUTH_URL is not configured.");
  }
  return `${baseUrl}/activate-account?token=${rawToken}`;
}

export function createActivationCredentials(): {
  rawToken: string;
  tokenHash: string;
  expiresAt: Date;
  activationUrl: string;
} {
  const rawToken = generateActivationToken();
  const tokenHash = hashActivationToken(rawToken);
  const expiresAt = getActivationExpiry();
  const activationUrl = buildActivationUrl(rawToken);

  return { rawToken, tokenHash, expiresAt, activationUrl };
}

export function isActivationExpired(
  expiresAt: Date | null | undefined,
  now: Date = new Date()
): boolean {
  if (!expiresAt) return true;
  return expiresAt.getTime() <= now.getTime();
}
