import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { AccountStatus } from "@prisma/client";
import { authOptions } from "@/lib/auth/auth-options";
import { ADMIN_ROLE } from "@/lib/auth/constants";
import { prisma } from "@/lib/prisma";

export class AuthError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

export async function getSession() {
  return getServerSession(authOptions);
}

/**
 * Validates that the JWT belongs to an employee who still exists
 * and whose database account is currently ACTIVE.
 */
export async function requireActiveUser() {
  const session = await getSession();

  if (!session?.user?.id) {
    throw new AuthError("Unauthenticated.", 401);
  }

  const employeeId = Number(session.user.id);

  if (!Number.isInteger(employeeId)) {
    throw new AuthError("Unauthenticated.", 401);
  }

  const employee = await prisma.employee.findUnique({
    where: {
      id: employeeId,
    },
    select: {
      id: true,
      name: true,
      user: true,
      role: true,
      accountStatus: true,
    },
  });

  if (!employee || employee.accountStatus !== AccountStatus.ACTIVE) {
    throw new AuthError("Unauthenticated.", 401);
  }

  return {
    session,
    employee,
  };
}

/**
 * Validates that the current user is an ACTIVE administrator.
 */
export async function requireAdmin() {
  const result = await requireActiveUser();

  if (
    result.employee.role !== ADMIN_ROLE ||
    result.session.user.role !== ADMIN_ROLE
  ) {
    throw new AuthError("Forbidden.", 403);
  }

  return result;
}

/**
 * Guard for authenticated dashboard pages.
 */
export async function requireActivePage() {
  try {
    return await requireActiveUser();
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/login");
    }

    throw error;
  }
}

/**
 * Guard for administrator-only pages.
 */
export async function requireAdminPage() {
  try {
    return await requireAdmin();
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.status === 401) {
        redirect("/login");
      }

      redirect("/");
    }

    throw error;
  }
}

export function authErrorResponse(error: unknown) {
  if (error instanceof AuthError) {
    return {
      status: error.status,
      body: {
        error: error.message,
      },
    };
  }

  console.error("[auth] unexpected error");

  return {
    status: 500,
    body: {
      error: "Internal server error.",
    },
  };
}