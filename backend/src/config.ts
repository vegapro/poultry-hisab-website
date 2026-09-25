import { z } from 'zod';

const environmentSchema = z.object({
  DATABASE_URL: z.string().url(),
  CORS_ORIGIN: z.string().url(),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
});

export interface AppConfig {
  databaseUrl: string;
  corsOrigin: string;
  port: number;
}

export function loadConfig(environment: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = environmentSchema.parse(environment);
  return {
    databaseUrl: parsed.DATABASE_URL,
    corsOrigin: parsed.CORS_ORIGIN,
    port: parsed.PORT,
  };
}
