"use client";
import { useEffect, useState } from "react";
import { Button } from "@heroui/react";
import { ClipboardCheck, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";

export function KioskHeader() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Evitar hydration mismatch: next-themes devuelve undefined en SSR
  useEffect(() => setMounted(true), []);

  const isDark = mounted && theme === "dark";

  return (
    <header className='h-14 border-b border-divider bg-content1 flex items-center justify-between px-6 shrink-0 shadow-sm'>
      {/* Logo + Nombre */}
      <div className='flex items-center gap-3'>
        <div className='w-8 h-8 rounded-lg bg-primary flex items-center justify-center'>
          <ClipboardCheck className='w-5 h-5 text-primary-foreground' />
        </div>
        <div>
          <p className='text-sm font-bold text-foreground leading-none'>Dorada Check</p>
          <p className='text-xs text-default-400 leading-none mt-0.5'>Terminal de Marcaciones</p>
        </div>
      </div>

      {/* Fecha + toggle tema */}
      <div className='flex items-center gap-4'>
        {mounted && (
          <p className='text-xs text-default-500 hidden sm:block'>
            {new Date().toLocaleDateString("es-CO", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        )}
        <Button
          isIconOnly
          variant='ghost'
          size='sm'
          onPress={() => setTheme(isDark ? "light" : "dark")}
        >
          {isDark ? <Sun className='w-4 h-4' /> : <Moon className='w-4 h-4' />}
        </Button>
      </div>
    </header>
  );
}
