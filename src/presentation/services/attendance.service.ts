import type { AttendanceDTO } from "@/presentation/types";

export const attendanceService = {
  async getToday(): Promise<AttendanceDTO[]> {
    const res = await fetch("/api/attendance");
    if (!res.ok) throw new Error("Error al obtener marcaciones");
    return res.json();
  },

  async getTodayByDocument(document: string): Promise<AttendanceDTO[]> {
    const res = await fetch(`/api/attendance?document=${encodeURIComponent(document)}`);
    if (!res.ok) throw new Error("Error al obtener marcaciones");
    return res.json();
  },

  async register(
    document: string,
    type: "CHECK_IN" | "CHECK_OUT",
    deviceCode: string,
  ): Promise<AttendanceDTO> {
    const res = await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ document, type, deviceCode }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Error al registrar marcación");
    return data;
  },
};
