import { randomUUID } from "crypto";
import type { IEmployeeRepository } from "@/domain/repositories";
import type { Employee } from "@/domain/entities";

export interface RegisterDeviceDTO {
  document: string;
  /** Código presente en el dispositivo (si ya se registró antes). */
  deviceCode?: string;
}

export interface RegisterDeviceResult {
  employee: Employee;
  deviceCode: string;
}

/**
 * Vincula un dispositivo a un empleado mediante un código único.
 *
 * - Si el empleado aún no tiene dispositivo: se genera un código nuevo,
 *   se guarda en la BBDD y se devuelve para almacenarlo en el dispositivo.
 * - Si ya tiene dispositivo y coincide con el enviado: se reconfirma.
 * - Si ya tiene dispositivo y NO coincide: se rechaza (otro dispositivo).
 */
export class RegisterDeviceUseCase {
  constructor(private readonly employeeRepo: IEmployeeRepository) {}

  async execute(dto: RegisterDeviceDTO): Promise<RegisterDeviceResult> {
    const employee = await this.employeeRepo.findByDocument(dto.document);
    if (!employee) throw new Error("Empleado no encontrado");
    if (!employee.active) throw new Error("Empleado inactivo");

    if (employee.deviceCode) {
      if (dto.deviceCode && dto.deviceCode === employee.deviceCode) {
        return { employee, deviceCode: employee.deviceCode };
      }
      throw new Error("Este empleado ya está registrado en otro dispositivo");
    }

    const deviceCode = randomUUID();
    const updated = await this.employeeRepo.bindDevice(employee.id, deviceCode);
    return { employee: updated, deviceCode };
  }
}
