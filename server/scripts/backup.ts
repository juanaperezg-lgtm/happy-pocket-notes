import { promises as fs } from "fs";
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const execFileAsync = promisify(execFile);

const backupEnvSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  BACKUP_DIR: z.string().default("server/backups"),
  BACKUP_RETENTION_DAYS: z.coerce.number().int().positive().default(30),
  PG_DUMP_PATH: z.string().default("pg_dump"),
});

const parsed = backupEnvSchema.safeParse(process.env);
if (!parsed.success) {
  const details = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("\n");
  throw new Error(`Invalid backup environment:\n${details}`);
}

const env = parsed.data;

const cleanupOldBackups = async (backupDir: string, retentionDays: number) => {
  const entries = await fs.readdir(backupDir, { withFileTypes: true });
  const nowMs = Date.now();
  const maxAgeMs = retentionDays * 24 * 60 * 60 * 1000;

  await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".dump"))
      .map(async (entry) => {
        const filePath = path.join(backupDir, entry.name);
        const stat = await fs.stat(filePath);
        if (nowMs - stat.mtimeMs > maxAgeMs) {
          await fs.unlink(filePath);
        }
      }),
  );
};

const run = async () => {
  const backupDir = path.resolve(process.cwd(), env.BACKUP_DIR);
  await fs.mkdir(backupDir, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filePath = path.join(backupDir, `backup-${stamp}.dump`);

  await execFileAsync(env.PG_DUMP_PATH, [
    "--format=custom",
    "--no-owner",
    "--file",
    filePath,
    env.DATABASE_URL,
  ]);

  await cleanupOldBackups(backupDir, env.BACKUP_RETENTION_DAYS);
  console.log(`Backup created: ${filePath}`);
};

void run();
