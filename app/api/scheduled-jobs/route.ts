//rutas API para la página de calendario de trabajos
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireActiveUser, requireAdmin, authErrorResponse } from "@/lib/auth/session";


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
      const data = await request.json()
      const newScheduledJob = await prisma.scheduledJob.create({
        data,
        include: { client: true },
      })
      return NextResponse.json(newScheduledJob)
    } catch (error) {
      const { status, body } = authErrorResponse(error);
      return NextResponse.json(body, { status });
    }
  }
  
  export async function PATCH(request: Request) {
    try {
      await requireAdmin();
      const data = await request.json()
      const { id, client, ...updateData } = data
      if (!id) {
        return NextResponse.json({ error: "El id del trabajo es requerido" }, { status: 400 })
      }
      const updatedJob = await prisma.scheduledJob.update({
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
        return NextResponse.json({ error: "Job ID is required" }, { status: 400 })
      }
  
      await prisma.scheduledJob.delete({
        where: { id },
      })
  
      return NextResponse.json({ message: "Job deleted successfully" })
    } catch (error) {
      const { status, body } = authErrorResponse(error);
      return NextResponse.json(body, { status });
    }
  }