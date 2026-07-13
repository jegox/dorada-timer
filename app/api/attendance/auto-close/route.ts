import { NextRequest, NextResponse } from "next/server";
import { PrismaAttendanceRepository } from "@/infrastructure/repositories/attendance.repository";
import { AutoCloseAttendanceUseCase } from "@/application/use-cases/auto-close-attendance";

async function runAutoClose() {
  const repo = new PrismaAttendanceRepository();
  const useCase = new AutoCloseAttendanceUseCase(repo);
  return useCase.execute();
}

/**
 * Invocado por Vercel Cron (ver vercel.json). Vercel Cron usa peticiones GET
 * e incluye `Authorization: Bearer <CRON_SECRET>` si la variable existe.
 *
 * Programado a las 04:59 UTC = 23:59 hora Colombia (UTC-5).
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
  }
  try {
    const result = await runAutoClose();
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const result = await runAutoClose();
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
