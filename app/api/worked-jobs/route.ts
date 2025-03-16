//rutas API para la página de trabajos finalizados
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const workedJobs = await prisma.workedJob.findMany({
      include: {
        client: true,
      },
    })
    return NextResponse.json(workedJobs)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const newWorkedJob = await prisma.workedJob.create({
      data,
      include: { client: true },
    })
    return NextResponse.json(newWorkedJob)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
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
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()
    if (!id) {
      return NextResponse.json({ error: "El id es requerido" }, { status: 400 })
    }
    const deletedWorkedJob = await prisma.workedJob.delete({
      where: { id },
    })
    return NextResponse.json(deletedWorkedJob)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

