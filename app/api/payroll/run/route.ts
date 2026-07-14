import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runPayrollLiquidation } from "@/lib/payroll-cron";

const Schema = z.object({
  year:      z.number().int().min(2020).max(2100),
  month:     z.number().int().min(0).max(11),
  fortnight: z.union([z.literal(1), z.literal(2)]),
});

export async function POST(req: NextRequest) {
  try {
    const { year, month, fortnight } = Schema.parse(await req.json());
    const result = await runPayrollLiquidation(year, month, fortnight);
    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error" }, { status: 400 });
  }
}
