import { getToken, getApiKey, setApiKey } from "../utils/storage.js";

const BASE = "https://v2.api.noroff.dev";

async function request(endpoint, options = {}) {
  const response = await fetch(`${BASE}/${endpoint}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });

  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    const msg =
      json?.errors?.[0]?.message || json?.message || "An error occurred";
    throw new Error(msg);
  }

  return json;
}

export function register({ name, email, password }) {
  return request("auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export function login({ email, password }) {
  return request("auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function ensureAPIKey() {
  const existing = getApiKey();
  if (existing) return existing;

  const token = getToken();
  if (!token) throw new Error("Missing token. Please log in again.");

  const res = await request("auth/create-api-key", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  const key = res?.data?.key;
  if (!key) throw new Error("API key not found in response");

  setApiKey(key);
  return key;
}
