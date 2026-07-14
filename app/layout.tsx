import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/presentation/providers/Providers";
import { ThemeToggle } from "@/presentation/layouts/ThemeToggle";

export const metadata: Metadata = {
  title: "Dorada Timer — Terminal de Marcaciones",
  description: "Terminal de registro de asistencia",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Dorada Timer",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#e5372c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang='es' suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className='bg-background text-foreground flex flex-col overflow-hidden'
        style={{ height: "100dvh" }}
      >
        <Providers>
          <ThemeToggle />
          <main className='flex-1 min-h-0 overflow-auto p-4 bg-default-50 flex flex-col'>
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
