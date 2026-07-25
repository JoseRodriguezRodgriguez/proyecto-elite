import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { authErrorResponse, requireActiveUser, requireAdmin,
} from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const machineryCreateSchema = z.object({
  category: z.string().trim().min(1).max(100),
  description: z.string().trim().min(1).max(255),
  brand: z.string().trim().min(1).max(100),
  quantity: z.number().int().nonnegative(),
});

const machineryUpdateSchema = machineryCreateSchema
  .partial()
  .extend({
    id: z.coerce.number().int().positive(),
  });

const machineryDeleteSchema = z.object({
  id: z.coerce.number().int().positive(),
});

function validationError(error: z.ZodError) {
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

export async function GET() {
  try {
    await requireActiveUser();

    const machinery = await prisma.machinery.findMany({
      orderBy: {
        description: "asc",
      },
    });

    return NextResponse.json(machinery);
  } catch (error) {
    const { status, body } = authErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body: unknown = await request.json();
    const parsed = machineryCreateSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const machinery = await prisma.machinery.create({
      data: parsed.data,
    });

    return NextResponse.json(machinery, {
      status: 201,
    });
  } catch (error) {
    const { status, body } = authErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin();

    const body: unknown = await request.json();
    const parsed = machineryUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const {
      id,
      ...data
    } = parsed.data;

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        {
          error: "No fields were provided to update.",
        },
        {
          status: 400,
        }
      );
    }

    const machinery = await prisma.machinery.update({
      where: {
        id,
      },
      data,
    });

    return NextResponse.json(machinery);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        {
          error: "Machinery record not found.",
        },
        {
          status: 404,
        }
      );
    }

    const { status, body } = authErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin();

    const body: unknown = await request.json();
    const parsed = machineryDeleteSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(parsed.error);
    }

    await prisma.machinery.delete({
      where: {
        id: parsed.data.id,
      },
    });

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        {
          error: "Machinery record not found.",
        },
        {
          status: 404,
        }
      );
    }

    const { status, body } = authErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}