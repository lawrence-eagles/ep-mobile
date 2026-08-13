import { getEnv } from "../lib/env";

const env = getEnv();

// ================= SHARE APPS ==============
export async function shareApp(channel: string) {
  const res = await fetch(`${env.BACKEND_URL}/app`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ channel }),
  });

  if (!res.ok) throw new Error("Share failed");
  // return res.json();
  const data = await res.json();
  return data;
}
