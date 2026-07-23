/**
 * Local security smoke checks for employee accounts (DB-level).
 * Does not print passwords, hashes, or activation tokens.
 */
import { createHash, randomBytes } from "crypto";
import { PrismaClient, AccountStatus } from "@prisma/client";
import { compare, hash } from "bcryptjs";
import {
  createActivationCredentials,
  hashActivationToken,
  isActivationExpired,
} from "../lib/auth/activation-token";
import { normalizeUsername } from "../lib/auth/username";

const prisma = new PrismaClient();

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main() {
  const suffix = randomBytes(3).toString("hex");
  const user = normalizeUsername(`emp_${suffix}`);
  const activation = createActivationCredentials();

  const created = await prisma.employee.create({
    data: {
      name: "Smoke Test",
      phone: "11111111",
      user,
      role: "EMPLOYEE",
      password: null,
      accountStatus: AccountStatus.PENDING,
      activationTokenHash: activation.tokenHash,
      activationExpiresAt: activation.expiresAt,
    },
  });

  assert(created.password === null, "new account must have null password");
  assert(created.accountStatus === "PENDING", "new account must be PENDING");
  assert(created.activationTokenHash !== null, "token hash must be stored");
  assert(
    created.activationTokenHash ===
      createHash("sha256").update(activation.rawToken).digest("hex"),
    "stored hash must match SHA-256 of raw token"
  );

  const password = "SmokeTestPass99";
  const passwordHash = await hash(password, 12);

  await prisma.employee.update({
    where: {
      id: created.id,
      activationTokenHash: hashActivationToken(activation.rawToken),
    },
    data: {
      password: passwordHash,
      accountStatus: AccountStatus.ACTIVE,
      activationTokenHash: null,
      activationExpiresAt: null,
    },
  });

  const activated = await prisma.employee.findUniqueOrThrow({
    where: { id: created.id },
  });

  assert(activated.accountStatus === "ACTIVE", "account must become ACTIVE");
  assert(activated.activationTokenHash === null, "token hash cleared");
  assert(activated.activationExpiresAt === null, "token expiry cleared");
  assert(
    activated.password?.startsWith("$2") === true,
    "password must be bcrypt"
  );
  assert(await compare(password, activated.password!), "bcrypt compare works");
  assert(!(await compare("wrong-password", activated.password!)), "wrong password fails");

  const reused = await prisma.employee.findUnique({
    where: { activationTokenHash: hashActivationToken(activation.rawToken) },
  });
  assert(reused === null, "used activation token must not resolve");

  const expiredHash = hashActivationToken(randomBytes(32).toString("hex"));
  await prisma.employee.update({
    where: { id: created.id },
    data: {
      accountStatus: AccountStatus.PENDING,
      password: null,
      activationTokenHash: expiredHash,
      activationExpiresAt: new Date(Date.now() - 60_000),
    },
  });
  const expiredEmp = await prisma.employee.findUniqueOrThrow({
    where: { id: created.id },
  });
  assert(
    isActivationExpired(expiredEmp.activationExpiresAt),
    "expired token detected"
  );

  await prisma.employee.update({
    where: { id: created.id },
    data: {
      accountStatus: AccountStatus.DISABLED,
      password: passwordHash,
      activationTokenHash: null,
      activationExpiresAt: null,
    },
  });
  const disabled = await prisma.employee.findUniqueOrThrow({
    where: { id: created.id },
  });
  assert(disabled.accountStatus === "DISABLED", "disabled status set");

  const admin = await prisma.employee.findFirst({
    where: { role: "ADMIN", accountStatus: AccountStatus.ACTIVE },
  });
  assert(admin, "seeded admin must exist");
  assert(admin.password?.startsWith("$2") === true, "admin password bcrypt");

  await prisma.employee.delete({ where: { id: created.id } });

  console.log("DB smoke checks passed.");
}

main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "smoke failed";
    console.error(`Smoke checks failed: ${message}`);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
