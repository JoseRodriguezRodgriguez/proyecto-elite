import { USERNAME_PATTERN } from "@/lib/auth/constants";

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export function validateUsername(raw: string): {
  ok: true;
  username: string;
} | {
  ok: false;
  error: string;
} {
  const username = normalizeUsername(raw);

  if (!username) {
    return { ok: false, error: "Username is required." };
  }

  if (username.length < 3 || username.length > 64) {
    return {
      ok: false,
      error: "Username must be between 3 and 64 characters.",
    };
  }

  if (!USERNAME_PATTERN.test(username)) {
    return {
      ok: false,
      error:
        "Username may only contain letters, numbers, periods, hyphens, and underscores.",
    };
  }

  return { ok: true, username };
}
