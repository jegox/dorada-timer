import type { AttendanceStatus, AttendanceType } from "@/domain/entities";

export class AttendanceDomainService {
  private static readonly LATE_GRACE_MINUTES = 10;

  static resolveStatus(
    shiftStartTime: string,
    type: AttendanceType,
    now: Date = new Date(),
  ): AttendanceStatus {
    if (type === "CHECK_OUT") return "ON_TIME";

    const [hours, minutes] = shiftStartTime.split(":").map(Number);
    const shiftStart = new Date(now);
    shiftStart.setHours(hours, minutes, 0, 0);

    const graceCutoff = new Date(shiftStart);
    graceCutoff.setMinutes(shiftStart.getMinutes() + this.LATE_GRACE_MINUTES);
    if (now > graceCutoff) return "LATE";

    const earlyThreshold = new Date(shiftStart);
    earlyThreshold.setMinutes(shiftStart.getMinutes() - 30);
    if (now < earlyThreshold) return "EARLY";

    return "ON_TIME";
  }
}
