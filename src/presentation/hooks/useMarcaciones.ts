"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { AttendanceDTO, EmployeeDTO } from "@/presentation/types";
import { attendanceService } from "@/presentation/services/attendance.service";
import { employeeService } from "@/presentation/services/employee.service";
import { deviceCookie } from "@/shared/utils/cookies";

// ─── Geolocalización ─────────────────────────────────────────────────────────
const GEO_ALLOWED = { lat: 10.9292908, lng: -74.8319638, radiusMeters: 50 };

export type GeoStatus = "idle" | "checking" | "allowed" | "out_of_range" | "denied" | "unavailable";

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000;
  const r = (d: number) => (d * Math.PI) / 180;
  const dLat = r(lat2 - lat1);
  const dLng = r(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getCurrentLocation(): Promise<{ status: GeoStatus; distance: number | null }> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve({ status: "unavailable", distance: null });
      return;
    }

    // Safety timeout: en HTTP móvil el navegador bloquea GPS sin disparar
    // ningún callback (ni éxito ni error), dejando la promesa colgada.
    const fallback = setTimeout(() => {
      resolve({ status: "unavailable", distance: null });
    }, 11_000);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(fallback);
        // Si la precisión del GPS es peor que 100m no se puede verificar la posición
        if (pos.coords.accuracy > 100) {
          resolve({ status: "out_of_range", distance: null });
          return;
        }
        const d = haversineMeters(
          pos.coords.latitude,
          pos.coords.longitude,
          GEO_ALLOWED.lat,
          GEO_ALLOWED.lng,
        );
        resolve({
          status: d <= GEO_ALLOWED.radiusMeters ? "allowed" : "out_of_range",
          distance: Math.round(d),
        });
      },
      (err) => {
        clearTimeout(fallback);
        resolve({ status: err.code === 1 ? "denied" : "unavailable", distance: null });
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 },
    );
  });
}

// ─── Estado de la máquina ────────────────────────────────────────────────────
export type Phase = "loading" | "setup" | "check_in" | "check_out" | "done";

interface UseMarcacionesReturn {
  phase: Phase;
  geoStatus: GeoStatus;
  geoDistance: number | null;
  // Setup (primer uso del dispositivo)
  searchDoc: string;
  setupEmployee: EmployeeDTO | null;
  searching: boolean;
  // Activo (dispositivo ya identificado)
  employee: EmployeeDTO | null;
  currentTime: string;
  registering: boolean;
  error: string | null;
  success: string | null;
  // Acciones
  setSearchDoc: (v: string) => void;
  searchEmployee: () => Promise<void>;
  confirmDevice: () => Promise<void>;
  handleRegister: () => Promise<void>;
  retryGeo: () => void;
}

/** Determina la fase según los registros del día */
function resolvePhase(records: AttendanceDTO[]): Phase {
  const hasIn = records.some((r) => r.type === "CHECK_IN");
  const hasOut = records.some((r) => r.type === "CHECK_OUT");
  if (!hasIn) return "check_in";
  if (hasIn && !hasOut) return "check_out";
  return "done";
}

export function useMarcaciones(): UseMarcacionesReturn {
  const [phase, setPhase] = useState<Phase>("loading");
  const [geoStatus, setGeoStatus] = useState<GeoStatus>("idle");
  const [geoDistance, setGeoDistance] = useState<number | null>(null);
  const [employee, setEmployee] = useState<EmployeeDTO | null>(null);
  const [setupEmployee, setSetupEmployee] = useState<EmployeeDTO | null>(null);
  const [searchDoc, setSearchDoc] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [searching, setSearching] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const autoClosedRef = useRef(false);

  /** Verifica la ubicación del dispositivo */
  const checkGeo = useCallback(async () => {
    setGeoStatus("checking");
    const { status, distance } = await getCurrentLocation();
    setGeoStatus(status);
    setGeoDistance(distance);
    return status;
  }, []);

  const retryGeo = useCallback(() => {
    checkGeo();
  }, [checkGeo]);

  // Reloj (actualiza cada segundo)
  useEffect(() => {
    const tick = () => setCurrentTime(new Date().toLocaleTimeString("es-CO"));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Cierre automático de turnos a las 23:59:00 (solo dispara una vez)
  useEffect(() => {
    const id = setInterval(() => {
      const now = new Date();
      if (now.getHours() === 23 && now.getMinutes() === 59 && now.getSeconds() === 0) {
        if (!autoClosedRef.current) {
          autoClosedRef.current = true;
          attendanceService.autoClose().then(() => {
            // Si el empleado de este dispositivo tenía salida pendiente, marcar done
            setPhase((prev) => (prev === "check_out" ? "done" : prev));
          });
        }
      }
      // Resetear el flag al inicio de cada día
      if (now.getHours() === 0 && now.getMinutes() === 0 && now.getSeconds() === 0) {
        autoClosedRef.current = false;
      }
    }, 1000);
    return () => clearInterval(id);
  }, []);

  /** Carga los registros del empleado y determina la fase */
  const loadPhase = useCallback(async (doc: string) => {
    const records = await attendanceService.getTodayByDocument(doc);
    setPhase(resolvePhase(records));
  }, []);

  // Arranque: verificar ubicación primero, luego leer cookie
  useEffect(() => {
    checkGeo().then(() => {
      const doc = deviceCookie.get();
      if (!doc) {
        setPhase("setup");
        return;
      }
      employeeService
        .findByDocument(doc)
        .then((emp) => {
          if (emp && emp.active) {
            setEmployee(emp);
            return loadPhase(doc);
          }
          deviceCookie.clear();
          setPhase("setup");
        })
        .catch(() => {
          deviceCookie.clear();
          setPhase("setup");
        });
    });
  }, [loadPhase, checkGeo]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Buscar empleado durante el setup */
  const searchEmployee = useCallback(async () => {
    const doc = searchDoc.trim();
    if (!doc) return;
    setSearching(true);
    setSetupEmployee(null);
    setError(null);
    try {
      const found = await employeeService.findByDocument(doc);
      if (found && found.active) setSetupEmployee(found);
      else setError(found ? "Empleado inactivo" : "Empleado no encontrado");
    } catch {
      setError("Error al buscar empleado");
    } finally {
      setSearching(false);
    }
  }, [searchDoc]);

  /** Confirmar y bloquear el dispositivo a este empleado */
  const confirmDevice = useCallback(async () => {
    if (!setupEmployee) return;
    deviceCookie.set(setupEmployee.document);
    setEmployee(setupEmployee);
    setSetupEmployee(null);
    await loadPhase(setupEmployee.document);
  }, [setupEmployee, loadPhase]);

  /** Registrar entrada o salida — valida ubicación antes de registrar */
  const handleRegister = useCallback(async () => {
    if (!employee || (phase !== "check_in" && phase !== "check_out")) return;
    setRegistering(true);
    setError(null);
    setSuccess(null);
    try {
      // Verificación fresca de ubicación en cada intento de registro
      const freshStatus = await checkGeo();
      if (freshStatus !== "allowed") {
        setRegistering(false);
        return;
      }
      await attendanceService.register(
        employee.document,
        phase === "check_in" ? "CHECK_IN" : "CHECK_OUT",
      );
      setSuccess(phase === "check_in" ? "✓ Entrada registrada" : "✓ Salida registrada");
      await loadPhase(employee.document);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al registrar");
    } finally {
      setRegistering(false);
    }
  }, [employee, phase, loadPhase, checkGeo]);

  return {
    phase,
    geoStatus,
    geoDistance,
    searchDoc,
    setupEmployee,
    searching,
    employee,
    currentTime,
    registering,
    error,
    success,
    setSearchDoc,
    searchEmployee,
    confirmDevice,
    handleRegister,
    retryGeo,
  };
}
