import { MIN_PASSWORD_LENGTH } from "@/lib/auth/constants";

export function validatePassword(password: string): {
  ok: true;
} | {
  ok: false;
  error: string;
} {
  if (!password) {
    return { ok: false, error: "Password is required." };
  }

  if (password !== password.trim()) {
    return {
      ok: false,
      error: "Password must not have leading or trailing whitespace.",
    };
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      ok: false,
      error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    };
  }

  return { ok: true };
}

export function validatePasswordConfirmation(
  password: string,
  confirmPassword: string
): { ok: true } | { ok: false; error: string } {
  const base = validatePassword(password);
  if (!base.ok) return base;

  if (!confirmPassword) {
    return { ok: false, error: "Please confirm the password." };
  }

  if (password !== confirmPassword) {
    return { ok: false, error: "Passwords do not match." };
  }

  return { ok: true };
}
