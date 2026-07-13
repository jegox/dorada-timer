"use client";
import { useRouter } from "next/navigation";
import { RouterProvider } from "@heroui/react";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  const router = useRouter();
  return (
    <RouterProvider navigate={(path) => router.push(path)}>
      <ThemeProvider attribute='class' defaultTheme='light' enableSystem={false}>
        {children}
      </ThemeProvider>
    </RouterProvider>
  );
}
