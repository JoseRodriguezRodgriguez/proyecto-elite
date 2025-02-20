import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
    try {
        const employees = await prisma.employee.findMany();
        return NextResponse.json(employees)
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const newEmployee = await prisma.employee.create({ data });
        return NextResponse.json(newEmployee);
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const data = await request.json();
        const { id, ...updateData } = data;

        if(!id){
            return NextResponse.json({ error: "El id del cliente es requerido" }, { status: 400});
        }
        const updatedEmployee = await prisma.employee.update({
            where: { id },
            data: updateData,
        });
        return NextResponse.json(updatedEmployee);
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { id } = await request.json();
                if(!id) {
                    return NextResponse.json({ error: "El id es requerido" }, {status: 400});
                }
                const deletedEmployee = await prisma.employee.delete({ 
                    where: { id },
                });
                return NextResponse.json(deletedEmployee);
    } catch (error) {
        
    }
}