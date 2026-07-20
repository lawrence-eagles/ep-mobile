import { z } from "zod";

const envSchema = z.object({
  BACKEND_URL: z.url(),
  APP_SCHEME: z.string().min(1),
  ENV: z.enum(["development", "staging", "production"]),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

function loadEnv(): Env {
  const rawEnv = {
    BACKEND_URL: process.env.EXPO_PUBLIC_BACKEND_URL,
    APP_SCHEME: process.env.EXPO_PUBLIC_APP_SCHEME,
    ENV: process.env.EXPO_PUBLIC_ENV,
  };

  const parsed = envSchema.safeParse(rawEnv);

  if (!parsed.success) {
    const tree = z.treeifyError(parsed.error);

    console.error("❌ Invalid environment variables");
    console.error(JSON.stringify(tree, null, 2));

    throw new Error("Invalid environment variables");
  }

  return parsed.data;
}

export function getEnv(): Env {
  if (!cachedEnv) {
    cachedEnv = loadEnv();
  }
  return cachedEnv;
}
