import { z } from "zod";

export const RegisterAttendanceSchema = z.object({
  document: z.string().min(1).max(20),
  type: z.enum(["CHECK_IN", "CHECK_OUT"]),
});
