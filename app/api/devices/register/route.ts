import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { RegisterDeviceSchema } from "@/shared/validations/schemas";
import { PrismaEmployeeRepository } from "@/infrastructure/repositories/employee.repository";
import { RegisterDeviceUseCase } from "@/application/use-cases/register-device";

export async function POST(req: NextRequest) {
  try {
    const dto = RegisterDeviceSchema.parse(await req.json());
    const employeeRepo = new PrismaEmployeeRepository();
    const useCase = new RegisterDeviceUseCase(employeeRepo);
    const result = await useCase.execute(dto);
    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    const message = error instanceof Error ? error.message : "Error al registrar dispositivo";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
