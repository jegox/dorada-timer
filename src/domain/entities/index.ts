export interface Employee {
  id: string;
  document: string;
  fullName: string;
  position: string;
  active: boolean;
  deviceCode?: string | null;
  shiftId: string;
  shift?: Shift;
  createdAt: Date;
  updatedAt: Date;
}

export interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  createdAt: Date;
  updatedAt: Date;
}

export type AttendanceType = "CHECK_IN" | "CHECK_OUT";
export type AttendanceStatus = "ON_TIME" | "LATE" | "EARLY";

export interface Attendance {
  id: string;
  employeeId: string;
  employee?: Employee;
  type: AttendanceType;
  status: AttendanceStatus;
  createdAt: Date;
}
