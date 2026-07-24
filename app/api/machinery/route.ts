//rutas API para la página de maquinaria
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { requireActiveUser, requireAdmin, authErrorResponse } from "@/lib/auth/session";

const createMachinerySchema = z.object({
    category: z.string().trim().min(1, "La categoría es requerida").max(150, "La categoría no puede tener más de 150 caracteres"),
    description: z.string().trim().min(1).max(255),
    brand: z.string().trim().min(1).max(100),
    quantity: z.number().int().nonnegative("La cantidad debe ser un número entero no negativo"),
});

const updateMachinerySchema = createMachinerySchema
    .partial()
    .extend({
        id: z.coerce.number().int().positive("El id debe ser un número positivo")
    })
    .refine(
        (data) => 
            data.category !== undefined ||
            data.description !== undefined ||
            data.brand !== undefined ||
            data.quantity !== undefined,
        {
            message: "Al menos un campo debe ser proporcionado para actualizar"
        }
    );

const deleteMachinerySchema = z.object({
    id: z.coerce.number().int().positive("El id debe ser un número positivo")
});

function validateError(error: z.ZodError) {
    return NextResponse.json(
        {
            error: "Invalida data request",
            details: error.flatten().fieldErrors,
        },
        { status: 400 }
    );
}

// GET (listar maquinaria, todos los usuarios pueden acceder a esta ruta)
export async function GET() {
    try {
        await requireActiveUser();
        const machinery = await prisma.machinery.findMany({
            orderBy: { category: "asc" },
        });
        return NextResponse.json(machinery);
    } catch (error) {
        const { status, body } = authErrorResponse(error);
        return NextResponse.json(body, { status });
    }
}

// POST (crear maquinaria, solo los administradores pueden acceder a esta ruta)
export async function POST(request: Request) {
    try {
        await requireAdmin();
        const body: unknown = await request.json();
        const parsed = createMachinerySchema.safeParse(body);
        if (!parsed.success) {
            return validateError(parsed.error);
        }
        const newMachinery = await prisma.machinery.create({
            data: parsed.data,
        });
        return NextResponse.json(newMachinery, { status: 201 });
    } catch (error) {
        const { status, body } = authErrorResponse(error);
        return NextResponse.json(body, { status }) ;
    }
}

// PATCH (editar maquinaria, solo gerencia pueden acceder a esta ruta)
export async function PATCH(request: Request) {
    try {
        await requireAdmin();
        const body: unknown = await request.json();
        const parsed = updateMachinerySchema.safeParse(body);
        if (!parsed.success) {
            return validateError(parsed.error);
        }
        const { id, ...data } = parsed.data;
        const machinery = await prisma.machinery.update({
            where: { id },
            data: data,
        });
        return NextResponse.json(machinery);
    } catch (error) {
        if(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            return NextResponse.json({ error: "La maquinaria no fue encontrada" }, { status: 404 });
        }
        const { status, body } = authErrorResponse(error);
        return NextResponse.json(body, { status });
    }
}

// DELETE (borrar maquinaria, solo gerencia pueden acceder a esta ruta)
export async function DELETE(request: Request) {
    try {
        await requireAdmin();
        const body: unknown = await request.json();
        const parsed = deleteMachinerySchema.safeParse(body);
        if (!parsed.success) {
            return validateError(parsed.error);
        }
        await prisma.machinery.delete({
            where: { id: parsed.data.id },
        });
        return NextResponse.json({ ok: true, });
    } catch (error) {
        if(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            return NextResponse.json({ error: "La maquinaria no fue encontrada" }, { status: 404 });
        }
        const { status, body } = authErrorResponse(error);
        return NextResponse.json(body, { status });
    }
}