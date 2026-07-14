"use client";
import { useEffect, useState } from "react";
import { Button } from "@heroui/react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Evitar hydration mismatch: next-themes devuelve undefined en SSR
  useEffect(() => setMounted(true), []);

  const isDark = mounted && theme === "dark";

  return (
    <Button
      isIconOnly
      variant='ghost'
      size='sm'
      aria-label={isDark ? "Activar modo diurno" : "Activar modo nocturno"}
      className='fixed top-3 right-3 z-50'
      onPress={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Sun className='w-5 h-5' /> : <Moon className='w-5 h-5' />}
    </Button>
  );
}
