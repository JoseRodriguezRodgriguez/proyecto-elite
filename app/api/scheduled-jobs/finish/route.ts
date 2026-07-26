import { NextResponse } from "next/server";
import { z } from "zod";

import {
  authErrorResponse,
  requireAdmin,
} from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const finishScheduledJobSchema = z.object({
  id: z.coerce
    .number()
    .int()
    .positive("El trabajo seleccionado no es válido"),
});

export async function POST(
  request: Request
) {
  try {
    await requireAdmin();

    const body: unknown =
      await request.json();

    const parsed =
      finishScheduledJobSchema.safeParse(
        body
      );

    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            "Los datos proporcionados no son válidos",
          details: parsed.error.flatten(),
        },
        {
          status: 400,
        }
      );
    }

    const result =
      await prisma.$transaction(
        async (transaction) => {
          const scheduledJob =
            await transaction.scheduledJob.findUnique(
              {
                where: {
                  id: parsed.data.id,
                },
              }
            );

          if (!scheduledJob) {
            return null;
          }

          const workedJob =
            await transaction.workedJob.create(
              {
                data: {
                  service:
                    scheduledJob.service,
                  date: scheduledJob.date,
                  status: "Completed",
                  clientId:
                    scheduledJob.clientId,
                },
                include: {
                  client: true,
                },
              }
            );

          await transaction.scheduledJob.delete(
            {
              where: {
                id: scheduledJob.id,
              },
            }
          );

          return workedJob;
        }
      );

    if (!result) {
      return NextResponse.json(
        {
          error:
            "El trabajo programado no existe",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    const { status, body } =
      authErrorResponse(error);

    return NextResponse.json(body, {
      status,
    });
  }
}