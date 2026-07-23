import { hash, compare } from "bcryptjs";
import { BCRYPT_COST } from "@/lib/auth/constants";

export async function hashPassword(password: string): Promise<string> {
  return hash(password, BCRYPT_COST);
}

export async function verifyPassword(
  password: string,
  passwordHash: string
): Promise<boolean> {
  return compare(password, passwordHash);
}

export {
  validatePassword,
  validatePasswordConfirmation,
} from "@/lib/auth/password-validation";
