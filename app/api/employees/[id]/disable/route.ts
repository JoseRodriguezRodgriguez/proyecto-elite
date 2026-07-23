import { NextResponse } from "next/server";
import { AccountStatus } from "@prisma/client";
import { assertCanDisableEmployee } from "@/lib/auth/admin-guards";
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
    const { employee: actor } = await requireAdmin();
    const { id: rawId } = await context.params;
    const id = Number(rawId);

    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: "Valid id is required." }, { status: 400 });
    }

    const employee = await prisma.$transaction(async (tx) => {
      const target = await tx.employee.findUnique({ where: { id } });
      if (!target) {
        throw new Error("NOT_FOUND");
      }

      try {
        await assertCanDisableEmployee(target, actor.id, tx);
      } catch (guardError) {
        if (guardError instanceof Error) {
          throw new Error(`GUARD:${guardError.message}`);
        }
        throw guardError;
      }

      return tx.employee.update({
        where: { id },
        data: {
          accountStatus: AccountStatus.DISABLED,
          activationTokenHash: null,
          activationExpiresAt: null,
        },
        select: employeePublicSelect,
      });
    });

    return NextResponse.json({ employee: toPublicEmployee(employee) });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "NOT_FOUND") {
        return NextResponse.json({ error: "Employee not found." }, { status: 404 });
      }
      if (error.message.startsWith("GUARD:")) {
        return NextResponse.json(
          { error: error.message.replace(/^GUARD:/, "") },
          { status: 400 }
        );
      }
    }

    const { status, body } = authErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
