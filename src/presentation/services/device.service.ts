import type { EmployeeDTO } from "@/presentation/types";

export interface RegisterDeviceResponse {
  employee: EmployeeDTO;
  deviceCode: string;
}

export const deviceService = {
  async register(document: string, deviceCode?: string): Promise<RegisterDeviceResponse> {
    const res = await fetch("/api/devices/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ document, deviceCode }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Error al registrar dispositivo");
    return data;
  },
};
