import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET (listar clientes)
export async function GET() {
    try {
        const clients = await prisma.client.findMany();
        return NextResponse.json(clients);
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// POST (crear cliente)
export async function POST(request: Request) {
    try {
        const data = await request.json();
        const newClient = await prisma.client.create({ data });
        return NextResponse.json(newClient);
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// PATCH (editar cliente)
export async function PATCH(request:Request) {
    try {
        const data = await request.json();
        // Se espera que el objeto data incluya "id" y los campos a actualizar.
        // Por ejemplo: { id: 1, name: "Nuevo Nombre", address: "Nueva Dirección", phone: 123456 }
        const { id, ...updateData } = data;
        if (!id) {
            return NextResponse.json({ error: "El id del cliente es requerido" }, { status: 400 });
        }
        const updatedClient = await prisma.client.update({
            where: { id },
            data: updateData,
        });
        return NextResponse.json(updatedClient);
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
        const deletedClient = await prisma.client.delete({ 
            where: { id },
        });
        return NextResponse.json(deletedClient);
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });  
    }
}