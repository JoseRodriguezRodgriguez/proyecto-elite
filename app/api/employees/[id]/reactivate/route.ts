import { NextResponse } from "next/server";
import { AccountStatus } from "@prisma/client";
import { createActivationCredentials } from "@/lib/auth/activation-token";
import {
  employeePublicSelect,
  toPublicEmployee,
} from "@/lib/auth/employee-serializer";
import { authErrorResponse, requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id: rawId } = await context.params;
    const id = Number(rawId);

    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: "Valid id is required." }, { status: 400 });
    }

    const existing = await prisma.employee.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Employee not found." }, { status: 404 });
    }

    if (existing.accountStatus !== AccountStatus.DISABLED) {
      return NextResponse.json(
        { error: "Only disabled accounts can be reactivated this way." },
        { status: 400 }
      );
    }

    if (existing.password) {
      const employee = await prisma.employee.update({
        where: { id },
        data: {
          accountStatus: AccountStatus.ACTIVE,
          activationTokenHash: null,
          activationExpiresAt: null,
        },
        select: employeePublicSelect,
      });

      return NextResponse.json({
        employee: toPublicEmployee(employee),
        activationUrl: null,
      });
    }

    const activation = createActivationCredentials();
    const employee = await prisma.employee.update({
      where: { id },
      data: {
        accountStatus: AccountStatus.PENDING,
        activationTokenHash: activation.tokenHash,
        activationExpiresAt: activation.expiresAt,
      },
      select: employeePublicSelect,
    });

    return NextResponse.json({
      employee: toPublicEmployee(employee),
      activationUrl: activation.activationUrl,
    });
  } catch (error) {
    const { status, body } = authErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
