/**
 * server.js — Servidor custom de Next.js con cron de nómina.
 *
 * Cron: todos los 15 y último día de cada mes a las 23:45.
 * "45 23 15 * *"  → día 15
 * "45 23 28-31 * *" → verificamos manualmente si es el último día
 */
import { createServer } from "http";
import { parse } from "url";
import next from "next";
import cron from "node-cron";
import http from "http";

const dev  = process.env.NODE_ENV !== "production";
const app  = next({ dev });
const handle = app.getRequestHandler();

function isLastDayOfMonth() {
  const now  = new Date();
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return now.getDate() === last;
}

function triggerLiquidation() {
  const now       = new Date();
  const year      = now.getFullYear();
  const month     = now.getMonth(); // 0-indexed
  const fortnight = now.getDate() <= 15 ? 1 : 2;
  const body      = JSON.stringify({ year, month, fortnight });

  const options = {
    hostname: "localhost",
    port: process.env.PORT ?? 3001,
    path: "/api/payroll/run",
    method: "POST",
    headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
  };

  const req = http.request(options, (res) => {
    let data = "";
    res.on("data", (c) => { data += c; });
    res.on("end", () => console.log(`[payroll-cron] ${new Date().toISOString()} →`, data));
  });
  req.on("error", (e) => console.error("[payroll-cron] error:", e.message));
  req.write(body);
  req.end();
}

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(process.env.PORT ?? 3001, () => {
    console.log(`> dorada-timer ready on http://localhost:${process.env.PORT ?? 3001}`);

    // Día 15 a las 23:45
    cron.schedule("45 23 15 * *", () => {
      console.log("[payroll-cron] Ejecutando — día 15");
      triggerLiquidation();
    });

    // Último día del mes a las 23:45 (verificamos del 28 al 31)
    cron.schedule("45 23 28-31 * *", () => {
      if (isLastDayOfMonth()) {
        console.log("[payroll-cron] Ejecutando — último día del mes");
        triggerLiquidation();
      }
    });

    console.log("[payroll-cron] Scheduler activo: día 15 y último de cada mes a las 23:45");
  });
});
