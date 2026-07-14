/**
 * payroll-cron.ts — Lógica de liquidación quincenal de nómina.
 * Periodo 1: 1-15 del mes | Periodo 2: 16 al último día
 */
import { prisma } from "@/infrastructure/database/prisma";

const HOLIDAYS_2026: Record<string, number[]> = {
  enero:[1,12],febrero:[],marzo:[23],abril:[2,3],mayo:[1,18],junio:[5,29],
  julio:[13,20],agosto:[7,17],septiembre:[],octubre:[12],noviembre:[2,16],diciembre:[8,25],
};
const MONTH_ES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

function countFdsDays(from: Date, to: Date): number {
  let count = 0;
  const holidays = HOLIDAYS_2026[MONTH_ES[from.getMonth()]] ?? [];
  const cur = new Date(from);
  while (cur <= to) {
    const d = cur.getDay();
    if (d === 0 || d === 6 || holidays.includes(cur.getDate())) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

function lastDay(year: number, month: number) { return new Date(year, month + 1, 0).getDate(); }

function periodLabel(year: number, month: number, q: 1 | 2) {
  return q === 1
    ? `PRIMERA QUINCENA ${MONTH_ES[month].toUpperCase()} ${year}`
    : `SEGUNDA QUINCENA ${MONTH_ES[month].toUpperCase()} ${year}`;
}

export async function runPayrollLiquidation(year: number, month: number, fortnight: 1 | 2) {
  const fromDay = fortnight === 1 ? 1 : 16;
  const toDay   = fortnight === 1 ? 15 : lastDay(year, month);
  const from    = new Date(year, month, fromDay, 0, 0, 0);
  const to      = new Date(year, month, toDay, 23, 59, 59);
  const period  = periodLabel(year, month, fortnight);

  await prisma.payrollLiquidation.deleteMany({ where: { period } });

  const employees = await prisma.employee.findMany({
    where: { active: true },
    include: { settings: { include: { setting: true } } },
  });

  // AMOUNT_FDS_CHEF / AMOUNT_FDS_AUX
  const fdsDays = countFdsDays(from, to);
  for (const key of ["AMOUNT_FDS_CHEF", "AMOUNT_FDS_AUX"]) {
    const settings = await prisma.setting.findMany({
      where: { key, active: true }, include: { employees: true },
    });
    for (const s of settings) {
      const amount = parseFloat(s.value) * fdsDays;
      if (amount <= 0) continue;
      for (const e of s.employees) {
        await prisma.additionalPayment.create({
          data: { employeeId: e.employeeId, amount, date: to, concept: `${key} — ${fdsDays} días FDS/festivos` },
        });
      }
    }
  }

  // AMOUNT_SHIFT_LUNCH / AMOUNT_SHIFT_FOODS
  for (const emp of employees) {
    const checkIns = await prisma.attendance.count({
      where: { employeeId: emp.id, type: "CHECK_IN", createdAt: { gte: from, lte: to } },
    });
    for (const key of ["AMOUNT_SHIFT_LUNCH", "AMOUNT_SHIFT_FOODS"]) {
      const settings = await prisma.setting.findMany({
        where: { key, active: true }, include: { employees: true },
      });
      for (const s of settings) {
        if (!s.employees.some((e) => e.employeeId === emp.id)) continue;
        const rate = parseFloat(s.value);
        if (key === "AMOUNT_SHIFT_LUNCH") {
          if (checkIns === 13) {
            await prisma.additionalPayment.create({
              data: { employeeId: emp.id, amount: rate, date: to, concept: `AMOUNT_SHIFT_LUNCH — ${checkIns} días` },
            });
          }
        } else {
          const amount = rate * checkIns;
          if (amount > 0) {
            await prisma.additionalPayment.create({
              data: { employeeId: emp.id, amount, date: to, concept: `AMOUNT_SHIFT_FOODS — ${checkIns} días` },
            });
          }
        }
      }
    }
  }

  // Liquidación final
  const created: string[] = [];
  for (const emp of employees) {
    const checkIns = await prisma.attendance.count({
      where: { employeeId: emp.id, type: "CHECK_IN", createdAt: { gte: from, lte: to } },
    });
    const shiftValue = emp.settings[0]?.setting?.value ? parseFloat(emp.settings[0].setting.value) : 0;
    const workedAmount = shiftValue * checkIns;

    const addAgg = await prisma.additionalPayment.aggregate({
      where: { employeeId: emp.id, date: { gte: from, lte: to } }, _sum: { amount: true },
    });
    const dedAgg = await prisma.deduction.aggregate({
      where: { employeeId: emp.id, date: { gte: from, lte: to } }, _sum: { amount: true },
    });

    await prisma.payrollLiquidation.create({
      data: {
        period, startDate: from, endDate: to, employeeId: emp.id,
        amount:     workedAmount + Number(addAgg._sum.amount ?? 0),
        deductions: Number(dedAgg._sum.amount ?? 0),
      },
    });
    created.push(emp.id);
  }
  return { period, employees: created.length };
}
