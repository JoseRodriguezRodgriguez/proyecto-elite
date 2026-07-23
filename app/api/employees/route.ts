import { NextResponse } from "next/server";
import { AccountStatus, Prisma } from "@prisma/client";
import { createActivationCredentials } from "@/lib/auth/activation-token";
import { ALLOWED_ROLES, type AllowedRole } from "@/lib/auth/constants";
import {
  employeePublicSelect,
  toPublicEmployee,
} from "@/lib/auth/employee-serializer";
import { authErrorResponse, requireAdmin } from "@/lib/auth/session";
import { validateUsername } from "@/lib/auth/username";
import { prisma } from "@/lib/prisma";

function isAllowedRole(role: string): role is AllowedRole {
  return (ALLOWED_ROLES as readonly string[]).includes(role);
}

export async function GET() {
  try {
    await requireAdmin();

    const employees = await prisma.employee.findMany({
      select: employeePublicSelect,
      orderBy: { name: "asc" },
    });

    return NextResponse.json(employees.map(toPublicEmployee));
  } catch (error) {
    const { status, body } = authErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = (await request.json()) as {
      name?: unknown;
      phone?: unknown;
      user?: unknown;
      role?: unknown;
      password?: unknown;
    };

    if (body.password !== undefined) {
      return NextResponse.json(
        { error: "Password must not be provided when creating an account." },
        { status: 400 }
      );
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const role = typeof body.role === "string" ? body.role.trim() : "";
    const rawUser = typeof body.user === "string" ? body.user : "";

    if (!name || !phone || !role || !rawUser) {
      return NextResponse.json(
        { error: "name, phone, user, and role are required." },
        { status: 400 }
      );
    }

    if (!isAllowedRole(role)) {
      return NextResponse.json(
        { error: `role must be one of: ${ALLOWED_ROLES.join(", ")}.` },
        { status: 400 }
      );
    }

    const usernameResult = validateUsername(rawUser);
    if (!usernameResult.ok) {
      return NextResponse.json({ error: usernameResult.error }, { status: 400 });
    }

    const existing = await prisma.employee.findUnique({
      where: { user: usernameResult.username },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Username already exists." },
        { status: 409 }
      );
    }

    const activation = createActivationCredentials();

    const employee = await prisma.employee.create({
      data: {
        name,
        phone,
        user: usernameResult.username,
        role,
        password: null,
        accountStatus: AccountStatus.PENDING,
        activationTokenHash: activation.tokenHash,
        activationExpiresAt: activation.expiresAt,
      },
      select: employeePublicSelect,
    });

    return NextResponse.json(
      {
        employee: toPublicEmployee(employee),
        activationUrl: activation.activationUrl,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "Username already exists." },
          { status: 409 }
        );
      }
    }

    const { status, body } = authErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin();

    const body = (await request.json()) as {
      id?: unknown;
      name?: unknown;
      phone?: unknown;
      role?: unknown;
      user?: unknown;
      password?: unknown;
      accountStatus?: unknown;
    };

    if (body.password !== undefined) {
      return NextResponse.json(
        { error: "Password cannot be updated through this endpoint." },
        { status: 400 }
      );
    }

    if (
      body.accountStatus !== undefined ||
      body.user !== undefined
    ) {
      return NextResponse.json(
        {
          error:
            "Use dedicated account endpoints to change username or account status.",
        },
        { status: 400 }
      );
    }

    const id = typeof body.id === "number" ? body.id : Number(body.id);
    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: "Valid id is required." }, { status: 400 });
    }

    const data: { name?: string; phone?: string; role?: AllowedRole } = {};

    if (typeof body.name === "string") {
      const name = body.name.trim();
      if (!name) {
        return NextResponse.json({ error: "name cannot be empty." }, { status: 400 });
      }
      data.name = name;
    }

    if (typeof body.phone === "string") {
      const phone = body.phone.trim();
      if (!phone) {
        return NextResponse.json({ error: "phone cannot be empty." }, { status: 400 });
      }
      data.phone = phone;
    }

    if (typeof body.role === "string") {
      const role = body.role.trim();
      if (!isAllowedRole(role)) {
        return NextResponse.json(
          { error: `role must be one of: ${ALLOWED_ROLES.join(", ")}.` },
          { status: 400 }
        );
      }
      data.role = role;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update." },
        { status: 400 }
      );
    }

    try {
      const updated = await prisma.$transaction(async (tx) => {
        const current = await tx.employee.findUnique({ where: { id } });
        if (!current) {
          throw new Error("NOT_FOUND");
        }

        if (
          data.role &&
          data.role !== "ADMIN" &&
          current.role === "ADMIN" &&
          current.accountStatus === AccountStatus.ACTIVE
        ) {
          const activeAdmins = await tx.employee.count({
            where: {
              role: "ADMIN",
              accountStatus: AccountStatus.ACTIVE,
            },
          });
          if (activeAdmins <= 1) {
            throw new Error("LAST_ADMIN");
          }
        }

        return tx.employee.update({
          where: { id },
          data,
          select: employeePublicSelect,
        });
      });

      return NextResponse.json(toPublicEmployee(updated));
    } catch (innerError) {
      if (innerError instanceof Error) {
        if (innerError.message === "NOT_FOUND") {
          return NextResponse.json({ error: "Employee not found." }, { status: 404 });
        }
        if (innerError.message === "LAST_ADMIN") {
          return NextResponse.json(
            { error: "Cannot demote the last active administrator." },
            { status: 400 }
          );
        }
      }
      throw innerError;
    }
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json({ error: "Employee not found." }, { status: 404 });
    }

    const { status, body } = authErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

export async function DELETE(request: Request) {
  try {
    const { employee: actor } = await requireAdmin();
    const body = (await request.json()) as { id?: unknown };
    const id = typeof body.id === "number" ? body.id : Number(body.id);

    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: "Valid id is required." }, { status: 400 });
    }

    if (id === actor.id) {
      return NextResponse.json(
        { error: "You cannot delete your own account." },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      const target = await tx.employee.findUnique({ where: { id } });
      if (!target) {
        throw new Error("NOT_FOUND");
      }

      if (
        target.role === "ADMIN" &&
        target.accountStatus === AccountStatus.ACTIVE
      ) {
        const activeAdmins = await tx.employee.count({
          where: {
            role: "ADMIN",
            accountStatus: AccountStatus.ACTIVE,
          },
        });
        if (activeAdmins <= 1) {
          throw new Error("LAST_ADMIN");
        }
      }

      await tx.employee.delete({ where: { id } });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "NOT_FOUND") {
        return NextResponse.json({ error: "Employee not found." }, { status: 404 });
      }
      if (error.message === "LAST_ADMIN") {
        return NextResponse.json(
          { error: "Cannot delete the last active administrator." },
          { status: 400 }
        );
      }
    }

    const { status, body } = authErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
