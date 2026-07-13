import type {
  Employee,
  Shift,
  Attendance,
  AttendanceType,
  AttendanceStatus,
} from "@/domain/entities";

export interface IEmployeeRepository {
  findAll(): Promise<Employee[]>;
  findByDocument(document: string): Promise<Employee | null>;
  bindDevice(id: string, deviceCode: string): Promise<Employee>;
}

export interface IShiftRepository {
  findAll(): Promise<Shift[]>;
  findById(id: string): Promise<Shift | null>;
}

export interface IAttendanceRepository {
  findByDate(date: Date): Promise<Attendance[]>;
  findTodayByDocument(document: string): Promise<Attendance[]>;
  autoCloseShifts(date: Date): Promise<number>;
  create(data: {
    employeeId: string;
    type: AttendanceType;
    status: AttendanceStatus;
  }): Promise<Attendance>;
}
