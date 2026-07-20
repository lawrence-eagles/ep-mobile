import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";
import { getEnv } from "../lib/env";

const env = getEnv();

export const authClient = createAuthClient({
  baseURL: env.BACKEND_URL, // Base URL of your Better Auth backend.
  plugins: [
    expoClient({
      scheme: env.APP_SCHEME,
      storagePrefix: env.APP_SCHEME,
      storage: SecureStore,
    }),
  ],
});
