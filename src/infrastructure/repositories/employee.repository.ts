import { prisma } from "@/infrastructure/database/prisma";
import type { IEmployeeRepository } from "@/domain/repositories";
import type { Employee } from "@/domain/entities";

export class PrismaEmployeeRepository implements IEmployeeRepository {
  async findAll(): Promise<Employee[]> {
    const employees = await prisma.employee.findMany({
      include: { shift: true },
      orderBy: { fullName: "asc" },
    });
    return employees as Employee[];
  }

  async findByDocument(document: string): Promise<Employee | null> {
    const employee = await prisma.employee.findUnique({
      where: { document },
      include: { shift: true },
    });
    return employee as Employee | null;
  }

  async bindDevice(id: string, deviceCode: string): Promise<Employee> {
    const employee = await prisma.employee.update({
      where: { id },
      data: { deviceCode },
      include: { shift: true },
    });
    return employee as Employee;
  }
}
