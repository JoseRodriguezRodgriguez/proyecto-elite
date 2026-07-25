//rutas API para la página de trabajos finalizados
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { requireActiveUser, requireAdmin, authErrorResponse } from "@/lib/auth/session";

const createWorkedJobSchema = z.object({
  service: z.string().trim().min(1).max(255),
  date: z.coerce.date({error: "La fecha no es valida",}),
  status: z.literal("Completed").default("Completed"),
  clientId: z.number().int().positive(),
});

const updateWorkedJobSchema = createWorkedJobSchema
  .partial()
  .extend({
    id: z.coerce.number().int().positive(),
  })
  .refine(
    (data) =>
      data.service !== undefined ||
      data.date !== undefined ||
      data.status !== undefined ||
      data.clientId !== undefined,
    {
      message: "Al menos un campo debe ser proporcionado para actualizar",
    }
  );

const deleteWorkedJobSchema = z.object({
  id: z.coerce.number().int().positive(),
});

function validateError(error: z.ZodError) {
  const flattened = z.flattenError(error);

  return NextResponse.json(
    {
      error: "Los datos proporcionados no son válidos",
      details: {
        formErrors: flattened.formErrors,
        fieldErrors: flattened.fieldErrors,
      },
    },
    {
      status: 400,
    }
  );
}
export async function GET() {
  try {
    await requireActiveUser();
    const workedJobs = await prisma.workedJob.findMany({
      include: {
        client: true,
      },
    })
    return NextResponse.json(workedJobs)
  } catch (error) {
    const { status, body } = authErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    
    const body: unknown = await request.json();
    const parsed = createWorkedJobSchema.safeParse(body);
    if (!parsed.success) {
      return validateError(parsed.error);
    }
    const newWorkedJob = await prisma.workedJob.create({
      data: parsed.data,
      include: { client: true },
    });
    return NextResponse.json(newWorkedJob, { status: 201 });
  } catch (error) {

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return NextResponse.json(
        { error: "El cliente proporcionado no existe" },
        { status: 400 }
      );
    }
    const { status, body } = authErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin();

    const body: unknown = await request.json();
    const parsed = updateWorkedJobSchema.safeParse(body);

    if (!parsed.success) {
      return validateError(parsed.error);
    }

    const { id, ...data } = parsed.data;

    const updatedJob = await prisma.workedJob.update({
      where: {
        id,
      },
      data,
      include: {
        client: true,
      },
    });

    return NextResponse.json(updatedJob);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError 
    ) {
      if (error.code === "P2025") {
        return NextResponse.json(
          {
            error: "Trabajo finalizado no encontrado",
          },
          {
            status: 404,
          }
        );
      }

      if (error.code === "P2003") {
        return NextResponse.json(
          {
            error: "El cliente proporcionado no existe",
          },
          {
            status: 400,
          }
        );
      }
    }

    const { status, body } = authErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin();

    const body: unknown = await request.json();
    const parsed = deleteWorkedJobSchema.safeParse(body);

    if (!parsed.success) {
      return validateError(parsed.error);
    }

    await prisma.workedJob.delete({
      where: {
        id: parsed.data.id,
      },
    });

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Trabajo finalizado no encontrado" },
        { status: 404 }
      );
    }

    const { status, body } = authErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}