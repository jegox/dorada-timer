import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "./prisma/schema.prisma",
  datasource: {
    url:
      process.env.DATABASE_URL ??
      "postgresql://postgres:ExlbuyAZpCppmYfuUPqbaBlladjBNqBP@metro.proxy.rlwy.net:11252/railway?schema=dorada",
  },
});
