/**
 * HTTP smoke checks against local Next.js (expects npm run dev on :3000).
 * Never logs passwords, hashes, or full activation tokens.
 */
import { PrismaClient } from "@prisma/client";

const base = process.env.NEXTAUTH_URL || "http://localhost:3000";
const prisma = new PrismaClient();

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function parseCookies(res: Response): string {
  const anyHeaders = res.headers as Headers & {
    getSetCookie?: () => string[];
  };
  const setCookies =
    typeof anyHeaders.getSetCookie === "function"
      ? anyHeaders.getSetCookie()
      : [];
  return setCookies.map((c) => c.split(";")[0]).join("; ");
}

async function getCsrf(cookieJar: { value: string }) {
  const res = await fetch(`${base}/api/auth/csrf`, {
    headers: cookieJar.value ? { cookie: cookieJar.value } : undefined,
  });
  const extra = parseCookies(res);
  if (extra) {
    cookieJar.value = cookieJar.value
      ? `${cookieJar.value}; ${extra}`
      : extra;
  }
  const data = (await res.json()) as { csrfToken: string };
  return data.csrfToken;
}

async function signIn(
  cookieJar: { value: string },
  user: string,
  password: string
) {
  const csrfToken = await getCsrf(cookieJar);
  const body = new URLSearchParams({
    csrfToken,
    user,
    password,
    callbackUrl: `${base}/`,
    json: "true",
  });

  const res = await fetch(`${base}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      cookie: cookieJar.value,
    },
    body,
    redirect: "manual",
  });

  const extra = parseCookies(res);
  if (extra) {
    cookieJar.value = cookieJar.value
      ? `${cookieJar.value}; ${extra}`
      : extra;
  }

  return res;
}

async function main() {
  const adminUser = process.env.SEED_ADMIN_USER;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminUser || !adminPassword) {
    throw new Error(
      "Set SEED_ADMIN_USER and SEED_ADMIN_PASSWORD in the environment before running HTTP smoke checks."
    );
  }

  // Wrong password
  {
    const jar = { value: "" };
    const res = await signIn(jar, adminUser, "definitely-wrong-password");
    assert(res.status === 401 || res.status === 302, "wrong password rejected");
  }

  // Nonexistent user
  {
    const jar = { value: "" };
    const res = await signIn(jar, "no_such_user_xyz", "whatever-password");
    assert(
      res.status === 401 || res.status === 302,
      "nonexistent user rejected"
    );
  }

  // Admin login
  const adminJar = { value: "" };
  const adminLogin = await signIn(adminJar, adminUser, adminPassword);
  assert(
    adminLogin.status === 200 || adminLogin.status === 302,
    `admin login failed with status ${adminLogin.status}`
  );

  const sessionRes = await fetch(`${base}/api/auth/session`, {
    headers: { cookie: adminJar.value },
  });
  const session = (await sessionRes.json()) as {
    user?: { role?: string; user?: string; id?: string };
  };
  assert(session.user?.role === "ADMIN", "session.user.role must be ADMIN");
  assert(session.user?.user === adminUser.toLowerCase(), "session user set");

  // Create employee
  const username = `http_${Date.now().toString(36)}`;
  const createRes = await fetch(`${base}/api/employees`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie: adminJar.value,
    },
    body: JSON.stringify({
      name: "HTTP Test",
      phone: "22222222",
      user: username,
      role: "EMPLOYEE",
    }),
  });
  const created = (await createRes.json()) as {
    employee?: { id: number; accountStatus: string; user: string };
    activationUrl?: string;
    error?: string;
    password?: unknown;
    activationTokenHash?: unknown;
  };
  assert(createRes.status === 201, `create failed: ${created.error}`);
  assert(created.employee?.accountStatus === "PENDING", "created PENDING");
  assert(typeof created.activationUrl === "string", "activationUrl returned");
  assert(!("password" in (created.employee as object)), "no password field");
  assert(
    created.password === undefined && created.activationTokenHash === undefined,
    "sensitive fields not in response root"
  );

  const token = new URL(created.activationUrl!).searchParams.get("token");
  assert(token, "token present in activation URL");

  const dbEmp = await prisma.employee.findUniqueOrThrow({
    where: { id: created.employee!.id },
  });
  assert(dbEmp.password === null, "DB password null before activation");
  assert(dbEmp.activationTokenHash !== null, "hash stored in DB");
  assert(!dbEmp.activationTokenHash!.includes(token!), "raw token not stored");

  // Activate
  const activateRes = await fetch(`${base}/api/activate-account`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token,
      password: "EmployeePass99",
      confirmPassword: "EmployeePass99",
    }),
  });
  assert(activateRes.status === 200, "activation succeeds");

  const after = await prisma.employee.findUniqueOrThrow({
    where: { id: created.employee!.id },
  });
  assert(after.accountStatus === "ACTIVE", "ACTIVE after activation");
  assert(after.password?.startsWith("$2") === true, "password bcrypt");
  assert(after.activationTokenHash === null, "token cleared");

  // Reuse token
  const reuseRes = await fetch(`${base}/api/activate-account`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token,
      password: "EmployeePass99",
      confirmPassword: "EmployeePass99",
    }),
  });
  assert(reuseRes.status === 400, "used token rejected");

  // Employee can sign in
  const empJar = { value: "" };
  const empLogin = await signIn(empJar, username, "EmployeePass99");
  assert(
    empLogin.status === 200 || empLogin.status === 302,
    "employee login works"
  );

  // Employee cannot create accounts
  const forbidden = await fetch(`${base}/api/employees`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie: empJar.value,
    },
    body: JSON.stringify({
      name: "Nope",
      phone: "1",
      user: "nope_user",
      role: "EMPLOYEE",
    }),
  });
  assert(forbidden.status === 403, "non-admin create returns 403");

  // Duplicate username
  const dup = await fetch(`${base}/api/employees`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie: adminJar.value,
    },
    body: JSON.stringify({
      name: "Dup",
      phone: "1",
      user: username,
      role: "EMPLOYEE",
    }),
  });
  assert(dup.status === 409, "duplicate username returns 409");

  // Disable then login fails
  const disableRes = await fetch(
    `${base}/api/employees/${created.employee!.id}/disable`,
    {
      method: "POST",
      headers: { cookie: adminJar.value },
    }
  );
  assert(disableRes.status === 200, "disable works");
  const disabledLogin = await signIn(empJar, username, "EmployeePass99");
  assert(
    disabledLogin.status === 401 || disabledLogin.status === 302,
    "disabled cannot login"
  );

  // Cleanup
  await prisma.employee.delete({ where: { id: created.employee!.id } });

  console.log("HTTP smoke checks passed.");
}

main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "http smoke failed";
    console.error(`HTTP smoke failed: ${message}`);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
