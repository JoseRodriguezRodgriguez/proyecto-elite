import { NextResponse } from "next/server";

import {
  authErrorResponse,
  requireActiveUser,
} from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

function getTodayRange(
  dateValue: string | null,
  timezoneOffsetValue: string | null
) {
  const now = new Date();

  const fallbackDate = [
    now.getUTCFullYear(),
    now.getUTCMonth() + 1,
    now.getUTCDate(),
  ];

  const parsedDate = dateValue
    ?.split("-")
    .map(Number);

  const [year, month, day] =
    parsedDate?.length === 3 &&
    parsedDate.every(Number.isInteger)
      ? parsedDate
      : fallbackDate;

  const parsedOffset = Number(
    timezoneOffsetValue
  );

  const timezoneOffset =
    Number.isFinite(parsedOffset)
      ? parsedOffset
      : 0;

  const startTimestamp =
    Date.UTC(
      year,
      month - 1,
      day,
      0,
      0,
      0,
      0
    ) +
    timezoneOffset * 60_000;

  return {
    start: new Date(startTimestamp),
    end: new Date(
      startTimestamp +
        24 * 60 * 60 * 1000
    ),
  };
}

export async function GET(
  request: Request
) {
  try {
    await requireActiveUser();

    const url = new URL(request.url);

    const { start, end } =
      getTodayRange(
        url.searchParams.get("date"),
        url.searchParams.get(
          "timezoneOffset"
        )
      );

    const [
      totalClients,
      totalScheduledJobs,
      todayJobs,
      totalWorkedJobs,
      outOfStockSupplies,
      upcomingJobs,
    ] = await prisma.$transaction([
      prisma.client.count(),

      prisma.scheduledJob.count(),

      prisma.scheduledJob.count({
        where: {
          date: {
            gte: start,
            lt: end,
          },
        },
      }),

      prisma.workedJob.count(),

      prisma.supply.count({
        where: {
          quantity: {
            lte: 0,
          },
        },
      }),

      prisma.scheduledJob.findMany({
        where: {
          date: {
            gte: new Date(),
          },
        },
        select: {
          id: true,
          service: true,
          date: true,
          hour: true,
          clientId: true,
          client: {
            select: {
              name: true,
            },
          },
        },
        orderBy: [
          {
            date: "asc",
          },
          {
            hour: "asc",
          },
        ],
        take: 5,
      }),
    ]);

    return NextResponse.json({
      totalClients,
      totalScheduledJobs,
      todayJobs,
      totalWorkedJobs,
      outOfStockSupplies,
      upcomingJobs,
    });
  } catch (error) {
    const { status, body } =
      authErrorResponse(error);

    return NextResponse.json(body, {
      status,
    });
  }
}