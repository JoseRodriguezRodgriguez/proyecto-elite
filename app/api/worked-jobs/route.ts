//rutas API para la página de trabajos finalizados
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { requireActiveUser, requireAdmin, authErrorResponse } from "@/lib/auth/session";

const workedJobSchema = z.object({
  service: z.string().trim().min(1).max(255),
  date: z.coerce.date(),
  status: z.string().trim().min(1).max(50),
  clientId: z.number().int().positive(),
});

const updateWorkedJobSchema = workedJobSchema
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
  return NextResponse.json(
    {
      error: "Invalid request data",
      details: error.flatten().fieldErrors,
    },
    { status: 400 }
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
    const data = await request.json()
    const newWorkedJob = await prisma.workedJob.create({
      data,
      include: { client: true },
    })
    return NextResponse.json(newWorkedJob)
  } catch (error) {
    const { status, body } = authErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    const data = await request.json()
    const { id, ...updateData } = data
    if (!id) {
      return NextResponse.json({ error: "El id del trabajo es requerido" }, { status: 400 })
    }
    const updatedJob = await prisma.workedJob.update({
      where: { id },
      data: updateData,
      include: { client: true },
    })
    return NextResponse.json(updatedJob)
  } catch (error) {
    const { status, body } = authErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin();
    const { id } = await request.json()
    if (!id) {
      return NextResponse.json({ error: "El id es requerido" }, { status: 400 })
    }
    const deletedWorkedJob = await prisma.workedJob.delete({
      where: { id },
    })
    return NextResponse.json(deletedWorkedJob)
  } catch (error) {
    const { status, body } = authErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}