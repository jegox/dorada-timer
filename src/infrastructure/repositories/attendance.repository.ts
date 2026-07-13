import { prisma } from "@/infrastructure/database/prisma";
import type { IAttendanceRepository } from "@/domain/repositories";
import type { Attendance, AttendanceType, AttendanceStatus } from "@/domain/entities";

export class PrismaAttendanceRepository implements IAttendanceRepository {
  async findByDate(date: Date): Promise<Attendance[]> {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const records = await prisma.attendance.findMany({
      where: { createdAt: { gte: start, lte: end } },
      include: { employee: { include: { shift: true } } },
      orderBy: { createdAt: "desc" },
    });
    return records as Attendance[];
  }

  async findTodayByDocument(document: string): Promise<Attendance[]> {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

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
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

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
