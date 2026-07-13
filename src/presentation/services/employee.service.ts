import type { EmployeeDTO } from "@/presentation/types";

export const employeeService = {
  async findByDocument(document: string): Promise<EmployeeDTO | null> {
    const res = await fetch(`/api/employees?document=${encodeURIComponent(document)}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("Error al buscar empleado");
    return res.json();
  },
};
