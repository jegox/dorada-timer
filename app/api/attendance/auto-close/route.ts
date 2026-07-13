import { NextResponse } from "next/server";
import { PrismaAttendanceRepository } from "@/infrastructure/repositories/attendance.repository";
import { AutoCloseAttendanceUseCase } from "@/application/use-cases/auto-close-attendance";

export async function POST() {
  try {
    const repo = new PrismaAttendanceRepository();
    const useCase = new AutoCloseAttendanceUseCase(repo);
    const result = await useCase.execute();
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
