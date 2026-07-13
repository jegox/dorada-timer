export interface ShiftDTO {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
}

export interface EmployeeDTO {
  id: string;
  document: string;
  fullName: string;
  position: string;
  active: boolean;
  deviceCode?: string | null;
  shiftId: string;
  shift: ShiftDTO | null;
}

export interface AttendanceDTO {
  id: string;
  type: "CHECK_IN" | "CHECK_OUT";
  status: "ON_TIME" | "LATE" | "EARLY";
  createdAt: string;
  employee: EmployeeDTO;
}
