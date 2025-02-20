import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
    try {
      const scheduledJobs = await prisma.scheduledJob.findMany({
        include: {
          client: true,
        },
      })
      return NextResponse.json(scheduledJobs)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error"
      return NextResponse.json({ error: message }, { status: 500 })
    }
  }
  
  export async function POST(request: Request) {
    try {
      const data = await request.json()
      // Asumimos que data.date ya viene en formato ISO desde el cliente
      const newScheduledJob = await prisma.scheduledJob.create({
        data,
        include: { client: true },
      })
      return NextResponse.json(newScheduledJob)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error"
      return NextResponse.json({ error: message }, { status: 500 })
    }
  }
  
  export async function PATCH(request: Request) {
    try {
      const data = await request.json()
      const { id, client, ...updateData } = data
      if (!id) {
        return NextResponse.json({ error: "El id del trabajo es requerido" }, { status: 400 })
      }
      // No necesitamos convertir la fecha aquí, asumimos que viene en formato ISO
      const updatedJob = await prisma.scheduledJob.update({
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
        return NextResponse.json({ error: "Job ID is required" }, { status: 400 })
      }
  
      await prisma.scheduledJob.delete({
        where: { id },
      })
  
      return NextResponse.json({ message: "Job deleted successfully" })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error"
      return NextResponse.json({ error: message }, { status: 500 })
    }
  }