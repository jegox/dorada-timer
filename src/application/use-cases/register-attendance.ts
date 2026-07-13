import type { IAttendanceRepository, IEmployeeRepository } from "@/domain/repositories";
import type { Attendance, AttendanceType } from "@/domain/entities";
import { AttendanceDomainService } from "@/domain/services/attendance.domain-service";

export interface RegisterAttendanceDTO {
  document: string;
  type: AttendanceType;
  deviceCode: string;
}

export class RegisterAttendanceUseCase {
  constructor(
    private readonly attendanceRepo: IAttendanceRepository,
    private readonly employeeRepo: IEmployeeRepository,
  ) {}

  async execute(dto: RegisterAttendanceDTO): Promise<Attendance> {
    const employee = await this.employeeRepo.findByDocument(dto.document);
    if (!employee) throw new Error("Empleado no encontrado");
    if (!employee.active) throw new Error("Empleado inactivo");

    if (!employee.deviceCode) throw new Error("Dispositivo no registrado");
    if (employee.deviceCode !== dto.deviceCode) {
      throw new Error("Dispositivo no autorizado");
    }

    const status = AttendanceDomainService.resolveStatus(
      employee.shift?.startTime ?? "08:00",
      dto.type,
    );

    return this.attendanceRepo.create({
      employeeId: employee.id,
      type: dto.type,
      status,
    });
  }
}
