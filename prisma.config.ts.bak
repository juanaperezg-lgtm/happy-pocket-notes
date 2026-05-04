import { defineConfig } from "prisma/config";
import "dotenv/config";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is missing. Set it in your .env file.");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrate: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl,
  },
});
