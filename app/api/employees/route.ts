import { NextRequest, NextResponse } from "next/server";
import { PrismaEmployeeRepository } from "@/infrastructure/repositories/employee.repository";

export async function GET(req: NextRequest) {
  try {
    const repo = new PrismaEmployeeRepository();
    const document = req.nextUrl.searchParams.get("document");

    if (document) {
      const employee = await repo.findByDocument(document);
      if (!employee) return NextResponse.json({ error: "Empleado no encontrado" }, { status: 404 });
      return NextResponse.json(employee);
    }

    const employees = await repo.findAll();
    return NextResponse.json(employees);
  } catch {
    return NextResponse.json({ error: "Error al obtener empleados" }, { status: 500 });
  }
}
