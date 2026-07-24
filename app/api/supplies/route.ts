//rutas API para la página de suministros
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { requireActiveUser, requireAdmin, authErrorResponse } from "@/lib/auth/session";

const supplySchema = z.object({
    description: z.string().trim().max(255).optional(),
    quantity: z.number().int().nonnegative("La cantidad debe ser un número entero no negativo"),
});

const updateSupplySchema = supplySchema
    .partial()
    .extend({
        id: z.coerce.number().int().positive("El id debe ser un número positivo")
    })
    .refine(
        (data) => 
            data.description !== undefined ||
            data.quantity !== undefined,
        {
            message: "Al menos un campo debe ser proporcionado para actualizar"
        }
    );
    
const deleteSupplySchema = z.object({
    id: z.coerce.number().int().positive("El id debe ser un número positivo")
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

// GET (listar suministros, todos los usuarios pueden acceder a esta ruta)
export async function GET() {
    try {
        await requireActiveUser();
        const supplies = await prisma.supply.findMany({
            orderBy: { description: "asc" },
        });
        return NextResponse.json(supplies);
    } catch (error) {
        const { status, body } = authErrorResponse(error);
        return NextResponse.json(body, { status });
    }
}

// POST (crear suministro, solo gerencia puede acceder a esta ruta)
export async function POST(request: Request) {
    try {
        await requireAdmin();
        const body: unknown = await request.json();
        const parsed = supplySchema.safeParse(body);
        if (!parsed.success) {
            return validateError(parsed.error);
        }
        const newSupply = await prisma.supply.create({
            data: parsed.data,
        });
        return NextResponse.json(newSupply, { status: 201 });
    } catch (error) {
        const { status, body } = authErrorResponse(error);
        return NextResponse.json(body, { status });
    }
}

// PATCH (editar suministro, solo gerencia puede acceder a esta ruta)
export async function PATCH(request:Request) {
    try {
        await requireAdmin();
        const body: unknown = await request.json();
        const parsed = updateSupplySchema.safeParse(body);
        if (!parsed.success) {
            return validateError(parsed.error);
        }
        const { id, ...data } = parsed.data;
        const updatedsupply = await prisma.supply.update({
            where: { id },
            data,
        });
        return NextResponse.json(updatedsupply);
    } catch (error) {
        const { status, body } = authErrorResponse(error);
        return NextResponse.json(body, { status });
    }
}

// DELETE (borrar suministro, solo gerencia puede acceder a esta ruta)
export async function DELETE(request:Request) {
    try {
        await requireAdmin();
        const body: unknown = await request.json();
        const parsed = deleteSupplySchema.safeParse(body);
        if (!parsed.success) {
            return validateError(parsed.error);
        }
        await prisma.supply.delete({ 
            where: { id: parsed.data.id },
        });
        return NextResponse.json({ok: true});
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            return NextResponse.json({ error: "Suministro no encontrado" }, { status: 404 });
        }
        const { status, body } = authErrorResponse(error);
        return NextResponse.json(body, { status });
    }
}