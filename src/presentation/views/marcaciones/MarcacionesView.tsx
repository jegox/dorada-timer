"use client";
import { Button, Spinner } from "@heroui/react";
import {
  Search,
  LogIn,
  LogOut,
  CheckCircle,
  Lock,
  UserCheck,
  MapPin,
  MapPinOff,
  RefreshCw,
} from "lucide-react";
import { useMarcaciones, type GeoStatus } from "@/presentation/hooks/useMarcaciones";

// ─── Indicador de ubicación GPS ──────────────────────────────────────────────────────
const GEO_CONFIG: Record<GeoStatus, { icon: typeof MapPin; label: string; cls: string }> = {
  idle: { icon: MapPin, label: "Verificando...", cls: "bg-default-100 text-default-500" },
  checking: { icon: MapPin, label: "Verificando ubicación", cls: "bg-amber-50 text-amber-600" },
  allowed: { icon: MapPin, label: "Ubicación verificada", cls: "bg-green-50 text-green-700" },
  out_of_range: {
    icon: MapPinOff,
    label: "Fuera del área permitida",
    cls: "bg-red-50 text-red-600",
  },
  denied: {
    icon: MapPinOff,
    label: "Permiso de ubicación denegado",
    cls: "bg-red-50 text-red-600",
  },
  unavailable: { icon: MapPinOff, label: "GPS no disponible", cls: "bg-red-50 text-red-600" },
};

function GeoBar({
  status,
  distance,
  onRetry,
}: {
  status: GeoStatus;
  distance: number | null;
  onRetry: () => void;
}) {
  const cfg = GEO_CONFIG[status];
  const Icon = cfg.icon;
  const isError = status === "out_of_range" || status === "denied" || status === "unavailable";
  const isChecking = status === "checking" || status === "idle";
  return (
    <div
      className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs font-medium ${cfg.cls}`}
    >
      <div className='flex items-center gap-1.5'>
        {isChecking ? <Spinner size='sm' /> : <Icon className='w-3.5 h-3.5 shrink-0' />}
        <span>
          {cfg.label}
          {status === "out_of_range" && distance !== null
            ? ` (≈${distance}m del punto autorizado)`
            : status === "out_of_range" && distance === null
              ? " (señal GPS insuficiente)"
              : ""}
        </span>
      </div>
      {isError && (
        <button
          onClick={onRetry}
          className='flex items-center gap-1 underline underline-offset-2 hover:opacity-80'
        >
          <RefreshCw className='w-3 h-3' /> Reintentar
        </button>
      )}
    </div>
  );
}

// ─── Pantalla de configuración del dispositivo ────────────────────────────────
function SetupScreen({
  searchDoc,
  setupEmployee,
  searching,
  error,
  geoStatus,
  geoDistance,
  setSearchDoc,
  searchEmployee,
  confirmDevice,
  retryGeo,
}: {
  searchDoc: string;
  setupEmployee: ReturnType<typeof useMarcaciones>["setupEmployee"];
  searching: boolean;
  error: string | null;
  geoStatus: GeoStatus;
  geoDistance: number | null;
  setSearchDoc: (v: string) => void;
  searchEmployee: () => void;
  confirmDevice: () => void;
  retryGeo: () => void;
}) {
  const geoAllowed = geoStatus === "allowed";
  return (
    <div className='flex flex-col items-center justify-center min-h-full py-8'>
      <div className='w-full max-w-md space-y-6'>
        {/* Logo Dorada Foods */}
        <div className='flex justify-center'>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src='/dorada-logo.png' alt='Dorada Foods' className='h-24 w-auto' />
        </div>

        {/* Formulario */}
        <div className='space-y-5'>
          <div className='flex flex-col items-center gap-2 text-center'>
            <h2 className='text-lg font-bold'>Configurar dispositivo</h2>
            <p className='text-sm text-default-500'>
              Este terminal se asociará permanentemente a tu cuenta. Ingresa tu número de documento
              para comenzar.
            </p>
          </div>

          <GeoBar status={geoStatus} distance={geoDistance} onRetry={retryGeo} />

          <div className='flex gap-2'>
            <input
              className='flex-1 h-10 px-3 rounded-lg border border-default-300 bg-default-100 text-sm focus:outline-none focus:border-primary disabled:opacity-50'
              placeholder='Número de documento'
              value={searchDoc}
              onChange={(e) => setSearchDoc(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchEmployee()}
              autoFocus
              disabled={!geoAllowed}
            />
            <Button
              variant='outline'
              isIconOnly
              size='sm'
              onPress={searchEmployee}
              isDisabled={searching || !geoAllowed}
            >
              {searching ? <Spinner size='sm' /> : <Search className='w-4 h-4' />}
            </Button>
          </div>

          {error && <p className='text-xs text-danger text-center'>{error}</p>}

          {setupEmployee && (
            <div className='space-y-4'>
              <div className='p-4 rounded-lg bg-default-50 border border-default-200 text-center space-y-1'>
                <div className='flex justify-center mb-2'>
                  <UserCheck className='w-8 h-8 text-primary' />
                </div>
                <p className='font-semibold'>{setupEmployee.fullName}</p>
                <p className='text-sm text-default-500'>{setupEmployee.position}</p>
                {setupEmployee.shift && (
                  <p className='text-xs text-default-400'>
                    {setupEmployee.shift.name} · {setupEmployee.shift.startTime} –{" "}
                    {setupEmployee.shift.endTime}
                  </p>
                )}
              </div>
              <Button
                variant='primary'
                className='w-full'
                onPress={confirmDevice}
                isDisabled={!geoAllowed}
              >
                <Lock className='w-4 h-4 mr-2' />
                Confirmar y bloquear dispositivo
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Pantalla activa (dispositivo ya identificado) ────────────────────────────
function ActiveScreen({
  phase,
  employee,
  currentTime,
  registering,
  error,
  success,
  geoStatus,
  geoDistance,
  handleRegister,
  retryGeo,
}: {
  phase: "check_in" | "check_out" | "done";
  employee: NonNullable<ReturnType<typeof useMarcaciones>["employee"]>;
  currentTime: string;
  registering: boolean;
  error: string | null;
  success: string | null;
  geoStatus: GeoStatus;
  geoDistance: number | null;
  handleRegister: () => void;
  retryGeo: () => void;
}) {
  const isCheckIn = phase === "check_in";
  const isDone = phase === "done";
  const geoAllowed = geoStatus === "allowed";

  return (
    <div className='flex flex-col items-center justify-center min-h-full py-8'>
      <div className='w-full max-w-md space-y-6'>
        {/* Logo Dorada Foods */}
        <div className='flex justify-center'>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src='/dorada-logo.png' alt='Dorada Foods' className='h-24 w-auto' />
        </div>

        {/* Formulario */}
        <div className='space-y-6'>
          {/* Empleado */}
          <div className='flex flex-col items-center gap-2 text-center'>
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${isDone ? "bg-green-100 text-green-600" : "bg-primary/10 text-primary"}`}
            >
              {employee.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className='text-lg font-bold'>{employee.fullName}</p>
              <p className='text-sm text-default-500'>{employee.position}</p>
              {employee.shift && (
                <p className='text-xs text-default-400 mt-0.5'>
                  {employee.shift.name} · {employee.shift.startTime} – {employee.shift.endTime}
                </p>
              )}
            </div>
          </div>

          {/* Reloj */}
          <div className='flex items-center justify-center gap-2 py-3 rounded-lg bg-default-100 border'>
            <span className='text-2xl font-mono font-bold tracking-widest'>{currentTime}</span>
          </div>

          {/* Estado de ubicación */}
          <GeoBar status={geoStatus} distance={geoDistance} onRetry={retryGeo} />

          {/* Estado / Acción */}
          {isDone ? (
            <div className='flex flex-col items-center gap-2 py-4 rounded-lg bg-green-50 border border-green-200'>
              <CheckCircle className='w-8 h-8 text-green-600' />
              <p className='font-semibold text-green-700'>Turno completado</p>
              <p className='text-xs text-green-600'>Has registrado entrada y salida hoy.</p>
            </div>
          ) : (
            <div className='space-y-3'>
              <p className='text-center text-sm text-default-500'>
                {isCheckIn
                  ? "Aún no has marcado entrada hoy"
                  : "Entrada registrada — recuerda marcar tu salida"}
              </p>

              {error && <p className='text-xs text-danger text-center'>{error}</p>}
              {success && (
                <div className='flex items-center justify-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200'>
                  <CheckCircle className='w-4 h-4 text-green-600 shrink-0' />
                  <p className='text-sm font-medium text-green-700'>{success}</p>
                </div>
              )}

              <Button
                variant='primary'
                className='w-full h-14 text-base font-semibold'
                onPress={handleRegister}
                isDisabled={registering || !geoAllowed}
              >
                {registering ? (
                  <Spinner size='sm' />
                ) : isCheckIn ? (
                  <>
                    <LogIn className='w-5 h-5 mr-2' /> Registrar Entrada
                  </>
                ) : (
                  <>
                    <LogOut className='w-5 h-5 mr-2' /> Registrar Salida
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Indicador de dispositivo bloqueado */}
          <div className='flex items-center justify-center gap-1.5 text-default-300'>
            <Lock className='w-3 h-3' />
            <p className='text-xs'>Dispositivo bloqueado a esta cuenta</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Vista principal ──────────────────────────────────────────────────────────
export function MarcacionesView() {
  const {
    phase,
    geoStatus,
    geoDistance,
    retryGeo,
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
  } = useMarcaciones();

  if (phase === "loading") {
    return (
      <div className='flex h-full items-center justify-center'>
        <Spinner size='lg' />
      </div>
    );
  }

  if (phase === "setup") {
    return (
      <SetupScreen
        searchDoc={searchDoc}
        setupEmployee={setupEmployee}
        searching={searching}
        error={error}
        geoStatus={geoStatus}
        geoDistance={geoDistance}
        setSearchDoc={setSearchDoc}
        searchEmployee={searchEmployee}
        confirmDevice={confirmDevice}
        retryGeo={retryGeo}
      />
    );
  }

  return (
    <ActiveScreen
      phase={phase}
      employee={employee!}
      currentTime={currentTime}
      registering={registering}
      error={error}
      success={success}
      geoStatus={geoStatus}
      geoDistance={geoDistance}
      handleRegister={handleRegister}
      retryGeo={retryGeo}
    />
  );
}
