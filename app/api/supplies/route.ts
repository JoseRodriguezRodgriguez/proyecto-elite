import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET (listar clientes)
export async function GET() {
    try {
        const supplies = await prisma.supply.findMany();
        return NextResponse.json(supplies);
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// POST (crear cliente)
export async function POST(request: Request) {
    try {
        const data = await request.json();
        const newSupply = await prisma.supply.create({ data });
        return NextResponse.json(newSupply);
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// PATCH (editar cliente)
export async function PATCH(request:Request) {
    try {
        const data = await request.json();
        const { id, ...updateData } = data;
        if (!id) {
            return NextResponse.json({ error: "El id del suministro es requerido" }, { status: 400 });
        }
        const updatedsupply = await prisma.supply.update({
            where: { id },
            data: updateData,
        });
        return NextResponse.json(updatedsupply);
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });  
    }
}

// DELETE (borrar cliente)
export async function DELETE(request:Request) {
    try {
        const { id } = await request.json();
        if(!id) {
            return NextResponse.json({ error: "El id es requerido" }, {status: 400});
        }
        const deletedSupply = await prisma.supply.delete({ 
            where: { id },
        });
        return NextResponse.json(deletedSupply);
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });  
    }
}