export const BCRYPT_COST = 12;

export const ADMIN_ROLE = "ADMIN";
export const EMPLOYEE_ROLE = "EMPLOYEE";

export const ALLOWED_ROLES = [ADMIN_ROLE, EMPLOYEE_ROLE] as const;

export type AllowedRole = (typeof ALLOWED_ROLES)[number];

export const GENERIC_LOGIN_ERROR = "Invalid username or password";

export const GENERIC_ACTIVATION_ERROR =
  "The activation link is invalid or has expired.";

export const ACTIVATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export const MIN_PASSWORD_LENGTH = 10;

export const USERNAME_PATTERN = /^[a-z0-9._-]+$/;
