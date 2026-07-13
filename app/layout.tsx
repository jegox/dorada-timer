import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/presentation/providers/Providers";
import { KioskHeader } from "@/presentation/layouts/KioskHeader";

export const metadata: Metadata = {
  title: "Dorada Timer — Terminal de Marcaciones",
  description: "Terminal de registro de asistencia",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang='es' suppressHydrationWarning>
      <head>
        <meta name='viewport' content='width=device-width, initial-scale=1.0' />
      </head>
      <body
        suppressHydrationWarning
        className='bg-background text-foreground flex flex-col overflow-hidden'
        style={{ height: "100dvh" }}
      >
        <Providers>
          <KioskHeader />
          <main className='flex-1 min-h-0 overflow-auto p-4 bg-default-50 flex flex-col'>
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
