//rutas API para la página de clientes
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { requireActiveUser, requireAdmin, authErrorResponse } from "@/lib/auth/session";

const createClientSchema = z.object({
    name: z.string().trim().min(1, "El nombre es requerido").max(150, "El nombre no puede tener más de 150 caracteres"),
    address: z.string().trim().min(1, "La dirección es requerida").max(255),
    phone: z.string().trim().min(1, "El teléfono es requerido").max(30),
    email: z.preprocess((value) => typeof value === "string" ? value.trim() : value, z.email({error: "Ingrese un correo electrónico válido"}).max(255, "El correo no puede tener más de 255 caracteres")),
    duiNit:z.string().trim().min(9, "El DUI/NIT debe contener al menos 9 caracteres").max(20, "El DUI/NIT no puede tener más de 20 caracteres").regex(/^[0-9\-]+$/, "El DUI/NIT solo puede contener números y guiones"),
    classification: z.string().trim().min(1).max(30).optional(),
    notes: z.string().trim().max(1000).nullable().optional()
});

const updateClientSchema = createClientSchema
    .partial()
    .extend({
        id: z.coerce.number().int().positive("El id debe ser un número positivo")
    })
    .refine(
        (data) => 
            data.name !== undefined ||
            data.address !== undefined ||
            data.phone !== undefined ||
            data.email !== undefined ||
            data.duiNit !== undefined ||
            data.classification !== undefined ||
            data.notes !== undefined,
        {
            message: "Al menos un campo debe ser proporcionado para actualizar"
        }
    );

const deleteClientSchema = z.object({
    id: z.coerce.number().int().positive("El id debe ser un número positivo")
});

function validateError(error: z.ZodError) {
  const flattened = z.flattenError(error);

  return NextResponse.json(
    {
      error: "Los datos proporcionados no son válidos",
      details: {
        formErrors: flattened.formErrors,
        fieldErrors: flattened.fieldErrors,
      },
    },
    {
      status: 400,
    }
  );
}
// GET (listar clientes, todos los usuarios pueden acceder a esta ruta)
export async function GET() {
    try {
        await requireActiveUser();
        const clients = await prisma.client.findMany({
            orderBy: { name: "asc" },
        });
        return NextResponse.json(clients);
    } catch (error) {
        const { status, body } = authErrorResponse(error);
        return NextResponse.json(body, { status });
    }
}

// POST (crear cliente, solo administradores pueden acceder a esta ruta)
export async function POST(request: Request) {
    try {
        await requireAdmin();
        const body: unknown = await request.json();
        const parsed = createClientSchema.safeParse(body);
        if (!parsed.success) {
            return validateError(parsed.error);
        }
        const newClient = await prisma.client.create({
            data: parsed.data,
        });
        return NextResponse.json(newClient, { status: 201 });
    } catch (error) {
        if (
          error instanceof
            Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          return NextResponse.json(
            {
              error:
                "Ya existe un cliente registrado con ese DUI/NIT",
              details: {
                formErrors: [],
                fieldErrors: {
                  duiNit: [
                    "El DUI/NIT ya está registrado",
                  ],
                },
              },
            },
            {
              status: 409,
            }
          );
        }
        const { status, body } = authErrorResponse(error);
        return NextResponse.json(body, { status });
    }
}

// PATCH (editar cliente, todos los usuarios pueden acceder a esta ruta)
export async function PATCH(request:Request) {
    try {
        await requireActiveUser();
        const body: unknown = await request.json();
        const parsed = updateClientSchema.safeParse(body);
        if (!parsed.success) {
            return validateError(parsed.error);
        }
        const { id, ...data } = parsed.data;
        const client = await prisma.client.update({
            where: { id },
            data: data,
        });
        return NextResponse.json(client);
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
        }
        if (
          error instanceof
            Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          return NextResponse.json(
            {
              error:
                "Ya existe un cliente registrado con ese DUI/NIT",
              details: {
                formErrors: [],
                fieldErrors: {
                  duiNit: [
                    "El DUI/NIT ya está registrado",
                  ],
                },
              },
            },
            {
              status: 409,
            }
          );
        }
        const { status, body } = authErrorResponse(error);
        return NextResponse.json(body, { status });
    }
}

// DELETE (borrar cliente, solo administradores pueden acceder a esta ruta)
export async function DELETE(request:Request) {
    try {
        await requireAdmin();
        const body: unknown = await request.json();
        const parsed = deleteClientSchema.safeParse(body);
        if (!parsed.success) {
            return validateError(parsed.error);
        }
        
        await prisma.client.delete({
            where: { id: parsed.data.id },
        });
        
        return NextResponse.json({ok: true,});
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === "P2025") {
            return NextResponse.json(
              { error: "Cliente no encontrado" },
              { status: 404 }
            );
          }
      
          if (error.code === "P2003") {
            return NextResponse.json(
              {
                error:
                  "No se puede eliminar el cliente porque tiene trabajos asociados",
              },
              { status: 409 }
            );
          }
        }
    
        const { status, body } = authErrorResponse(error);
        return NextResponse.json(body, { status });
    }       
}