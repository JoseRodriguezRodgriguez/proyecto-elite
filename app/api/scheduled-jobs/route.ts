//rutas API para la página de calendario de trabajos
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { requireActiveUser, requireAdmin, authErrorResponse } from "@/lib/auth/session";

const createScheduledJobSchema = z.object({
  service: z
    .string()
    .trim()
    .min(1, "El servicio es requerido")
    .max(255),

  date: z.coerce.date({
    error: "La fecha no es válida",
  }),

  hour: z
    .string()
    .trim()
    .regex(
      /^([01]\d|2[0-3]):[0-5]\d$/,
      "La hora debe utilizar el formato HH:mm"
    ),

  clientId: z
    .number()
    .int()
    .positive("El cliente seleccionado no es válido"),
});

const updateScheduledJobSchema = createScheduledJobSchema
  .partial()
  .extend({
    id: z.coerce.number().int().positive(),
  })
  .refine(
    (data) =>
      data.service !== undefined ||
      data.date !== undefined ||
      data.hour !== undefined ||
      data.clientId !== undefined,
    {
      message: "Debe proporcionar al menos un campo para actualizar",
    }
  );

const deleteScheduledJobSchema = z.object({
  id: z.coerce.number().int().positive(),
});

function validationError(error: z.ZodError) {
  return NextResponse.json(
    {
      error: "Los datos proporcionados no son válidos",
      details: error.flatten().fieldErrors,
    },
    {
      status: 400,
    }
  );
}

export async function GET() {
  try {
      await requireActiveUser();
      const scheduledJobs = await prisma.scheduledJob.findMany({
        include: {
          client: true,
        },
      })
      return NextResponse.json(scheduledJobs)
  } catch (error) {
    const { status, body } = authErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
  
export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body: unknown = await request.json();
    const parsed = createScheduledJobSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const newScheduledJob = await prisma.scheduledJob.create({
      data: parsed.data,
      include: {
        client: true,
      },
    });

    return NextResponse.json(newScheduledJob, {
      status: 201,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return NextResponse.json(
        { error: "El cliente seleccionado no existe" },
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
    const parsed = updateScheduledJobSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const { id, ...data } = parsed.data;

    const updatedJob = await prisma.scheduledJob.update({
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
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Trabajo programado no encontrado" },
        { status: 404 }
      );
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return NextResponse.json(
        { error: "El cliente seleccionado no existe" },
        { status: 400 }
      );
    }

    const { status, body } = authErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
  
export async function DELETE(request: Request) {
  try {
    await requireAdmin();

    const body: unknown = await request.json();
    const parsed = deleteScheduledJobSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(parsed.error);
    }

    await prisma.scheduledJob.delete({
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
        { error: "Trabajo programado no encontrado" },
        { status: 404 }
      );
    }

    const { status, body } = authErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}