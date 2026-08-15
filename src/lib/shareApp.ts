import { authClient } from "@/lib/auth-client";
import { getEnv } from "../lib/env";

const env = getEnv();

// ================= SHARE APPS ==============
export async function shareApp(channel: string) {
  const cookies = authClient.getCookie();
  const res = await fetch(`${env.BACKEND_URL}/app`, {
    method: "POST",
    credentials: "omit",
    headers: {
      "Content-Type": "application/json",
      ...(cookies ? { Cookie: cookies } : {}),
    },
    body: JSON.stringify({ channel }),
  });

  if (!res.ok) throw new Error("Share failed");
  // return res.json();
  const data = await res.json();
  return data;
}
