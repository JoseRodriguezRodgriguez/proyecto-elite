import { NextResponse } from "next/server";
import { AccountStatus, Prisma } from "@prisma/client";
import {
  hashActivationToken,
  isActivationExpired,
} from "@/lib/auth/activation-token";
import { GENERIC_ACTIVATION_ERROR } from "@/lib/auth/constants";
import {
  hashPassword,
  validatePasswordConfirmation,
} from "@/lib/auth/password";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      token?: unknown;
      password?: unknown;
      confirmPassword?: unknown;
    };

    const token = typeof body.token === "string" ? body.token.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const confirmPassword =
      typeof body.confirmPassword === "string" ? body.confirmPassword : "";

    if (!token) {
      return NextResponse.json(
        { error: GENERIC_ACTIVATION_ERROR },
        { status: 400 }
      );
    }

    const passwordCheck = validatePasswordConfirmation(password, confirmPassword);
    if (!passwordCheck.ok) {
      return NextResponse.json({ error: passwordCheck.error }, { status: 400 });
    }

    const tokenHash = hashActivationToken(token);

    const result = await prisma.$transaction(async (tx) => {
      const employee = await tx.employee.findUnique({
        where: { activationTokenHash: tokenHash },
      });

      if (
        !employee ||
        employee.accountStatus === AccountStatus.DISABLED ||
        !employee.activationTokenHash ||
        isActivationExpired(employee.activationExpiresAt)
      ) {
        return { ok: false as const };
      }

      const passwordHash = await hashPassword(password);

      await tx.employee.update({
        where: {
          id: employee.id,
          activationTokenHash: tokenHash,
        },
        data: {
          password: passwordHash,
          accountStatus: AccountStatus.ACTIVE,
          activationTokenHash: null,
          activationExpiresAt: null,
        },
      });

      return { ok: true as const };
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: GENERIC_ACTIVATION_ERROR },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: "Account activated successfully. You can now sign in.",
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { error: GENERIC_ACTIVATION_ERROR },
        { status: 400 }
      );
    }

    console.error("[activate-account] unexpected error");
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
