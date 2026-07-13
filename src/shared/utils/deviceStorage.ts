"use client";

/**
 * Almacenamiento local del dispositivo (localStorage).
 *
 * Se eligió localStorage sobre cookies porque:
 *  - Persiste de forma permanente (no expira), requisito del código único.
 *  - Permite guardar el snapshot completo del empleado sin límite de 4KB.
 *  - No se envía en cada request (la app es un cliente que llama a la API REST).
 */

const KEY_DEVICE_CODE = "dorada_device_code";
const KEY_EMPLOYEE = "dorada_employee";

export interface StoredShift {
  name: string;
  startTime: string;
  endTime: string;
}

export interface StoredEmployee {
  document: string;
  fullName: string;
  position: string;
  shift: StoredShift | null;
}

export const deviceStorage = {
  /** Código único del dispositivo. Permanece para siempre. */
  getDeviceCode(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(KEY_DEVICE_CODE);
  },
  setDeviceCode(code: string): void {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(KEY_DEVICE_CODE, code);
  },

  /** Snapshot de los datos del empleado (para no re-ingresarlos). */
  getEmployee(): StoredEmployee | null {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(KEY_EMPLOYEE);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as StoredEmployee;
    } catch {
      return null;
    }
  },
  setEmployee(emp: StoredEmployee): void {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(KEY_EMPLOYEE, JSON.stringify(emp));
  },

  getDocument(): string | null {
    return deviceStorage.getEmployee()?.document ?? null;
  },

  /**
   * Restablece el vínculo del dispositivo. Se usa solo en recuperación de
   * errores (empleado eliminado/inactivo o código no coincide con el servidor).
   */
  reset(): void {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(KEY_EMPLOYEE);
    window.localStorage.removeItem(KEY_DEVICE_CODE);
  },
};
