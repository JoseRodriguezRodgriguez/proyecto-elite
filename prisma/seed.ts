import { hash } from "bcryptjs";
import { AccountStatus, PrismaClient } from "@prisma/client";
import { BCRYPT_COST } from "../lib/auth/constants";
import { normalizeUsername, validateUsername } from "../lib/auth/username";

const prisma = new PrismaClient();

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

async function main() {
  const name = requireEnv("SEED_ADMIN_NAME");
  const rawUser = requireEnv("SEED_ADMIN_USER");
  const adminPassword = requireEnv("SEED_ADMIN_PASSWORD");
  const phone = requireEnv("SEED_ADMIN_PHONE");

  const usernameResult = validateUsername(rawUser);
  if (!usernameResult.ok) {
    throw new Error(`Invalid SEED_ADMIN_USER: ${usernameResult.error}`);
  }

  if (adminPassword.length < 10) {
    throw new Error("SEED_ADMIN_PASSWORD must be at least 10 characters.");
  }

  if (adminPassword !== adminPassword.trim()) {
    throw new Error(
      "SEED_ADMIN_PASSWORD must not have leading or trailing whitespace."
    );
  }

  const normalizedUser = normalizeUsername(usernameResult.username);
  const passwordHash = await hash(adminPassword, BCRYPT_COST);

  await prisma.employee.upsert({
    where: { user: normalizedUser },
    update: {
      name,
      phone,
      role: "ADMIN",
      password: passwordHash,
      accountStatus: AccountStatus.ACTIVE,
      activationTokenHash: null,
      activationExpiresAt: null,
    },
    create: {
      name,
      phone,
      user: normalizedUser,
      role: "ADMIN",
      password: passwordHash,
      accountStatus: AccountStatus.ACTIVE,
    },
  });

  console.log(`Seeded administrator account for user "${normalizedUser}".`);
}

main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Unknown seed error";
    console.error(`Seed failed: ${message}`);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
