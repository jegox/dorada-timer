import { prisma } from "@/infrastructure/database/prisma";
import type { IAttendanceRepository } from "@/domain/repositories";
import type { Attendance, AttendanceType, AttendanceStatus } from "@/domain/entities";

function getBogotaDayBounds(date: Date): { start: Date; end: Date } {
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

  return {
    start: new Date(Date.UTC(year, month - 1, day, 5, 0, 0, 0)),
    end: new Date(Date.UTC(year, month - 1, day + 1, 4, 59, 59, 999)),
  };
}

export class PrismaAttendanceRepository implements IAttendanceRepository {
  async findByDate(date: Date): Promise<Attendance[]> {
    const { start, end } = getBogotaDayBounds(date);

    const records = await prisma.attendance.findMany({
      where: { createdAt: { gte: start, lte: end } },
      include: { employee: { include: { shift: true } } },
      orderBy: { createdAt: "desc" },
    });
    return records as Attendance[];
  }

  async findTodayByDocument(document: string): Promise<Attendance[]> {
    const { start, end } = getBogotaDayBounds(new Date());

    const records = await prisma.attendance.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        employee: { document },
      },
      include: { employee: { include: { shift: true } } },
      orderBy: { createdAt: "asc" },
    });
    return records as Attendance[];
  }

  async autoCloseShifts(date: Date): Promise<number> {
    const { start, end } = getBogotaDayBounds(date);

    // Empleados que tienen CHECK_IN pero NO CHECK_OUT hoy
    const employees = await prisma.employee.findMany({
      where: {
        attendances: {
          some: { type: "CHECK_IN", createdAt: { gte: start, lte: end } },
          none: { type: "CHECK_OUT", createdAt: { gte: start, lte: end } },
        },
      },
    });

    if (employees.length === 0) return 0;

    await prisma.attendance.createMany({
      data: employees.map((e) => ({
        employeeId: e.id,
        type: "CHECK_OUT",
        status: "ON_TIME",
        createdAt: end,
      })),
    });

    return employees.length;
  }

  async create(data: {
    employeeId: string;
    type: AttendanceType;
    status: AttendanceStatus;
  }): Promise<Attendance> {
    const record = await prisma.attendance.create({
      data,
      include: { employee: { include: { shift: true } } },
    });
    return record as Attendance;
  }
}
