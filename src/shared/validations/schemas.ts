import { z } from "zod";

export const RegisterAttendanceSchema = z.object({
  document: z.string().min(1).max(20),
  type: z.enum(["CHECK_IN", "CHECK_OUT"]),
  deviceCode: z.string().min(1, "Dispositivo no registrado"),
});

export const RegisterDeviceSchema = z.object({
  document: z.string().min(1).max(20),
  deviceCode: z.string().min(1).optional(),
});
