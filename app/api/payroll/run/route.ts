import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runPayrollLiquidation } from "@/src/lib/payroll-cron";

const Schema = z.object({
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(0).max(11),
  fortnight: z.union([z.literal(1), z.literal(2)]),
});

function isLastDayOfMonth(date: Date): boolean {
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  return date.getDate() === lastDay;
}

function getBogotaDateParts(date: Date): { year: number; month: number; day: number } {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const year = Number(parts.find((part) => part.type === "year")?.value ?? "0");
  const month = Number(parts.find((part) => part.type === "month")?.value ?? "0");
  const day = Number(parts.find((part) => part.type === "day")?.value ?? "0");
  return { year, month, day };
}

function isLastDayOfMonthParts(parts: { year: number; month: number; day: number }): boolean {
  const lastDay = new Date(parts.year, parts.month, 0).getDate();
  return parts.day === lastDay;
}

function resolvePeriodFromDate(date: Date): { year: number; month: number; fortnight: 1 | 2 } {
  return {
    year: date.getFullYear(),
    month: date.getMonth(),
    fortnight: date.getDate() <= 15 ? 1 : 2,
  };
}

function isAuthorizedCronRequest(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const authHeader = req.headers.get("authorization") ?? "";
  return authHeader === `Bearer ${secret}`;
}

async function runWithBody(req: NextRequest) {
  const { year, month, fortnight } = Schema.parse(await req.json());
  return runPayrollLiquidation(year, month, fortnight);
}

export async function GET(req: NextRequest) {
  try {
    if (!isAuthorizedCronRequest(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const bogota = getBogotaDateParts(now);

    if (bogota.day > 15 && !isLastDayOfMonthParts(bogota)) {
      return NextResponse.json({ skipped: true, reason: "Not last day of month" }, { status: 200 });
    }

    const bogotaDate = new Date(Date.UTC(bogota.year, bogota.month - 1, bogota.day, 12, 0, 0));
    const { year, month, fortnight } = resolvePeriodFromDate(bogotaDate);
    const result = await runPayrollLiquidation(year, month, fortnight);
    return NextResponse.json({ trigger: "vercel-cron", ...result }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error" },
      { status: 400 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const result = await runWithBody(req);
    return NextResponse.json({ trigger: "manual", ...result }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error" },
      { status: 400 },
    );
  }
}
