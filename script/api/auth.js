import { getToken, getApiKey, setApiKey } from "../utils/storage.js";
import { apiFetch } from "./api-fetch.js";

export function register({ name, email, password }) {
  return apiFetch("auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export function login({ email, password }) {
  return apiFetch("auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function ensureAPIKey({ required = false } = {}) {
  const existing = getApiKey();
  if (existing) return existing;

  const token = getToken();
  if (!token) {
    if (required) throw new Error("Missing token, user must be logged in");
    return null;
  }

  const res = await apiFetch("auth/create-api-key", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  const key = res?.data?.key;
  if (!key) throw new Error("API key not found in response");

  setApiKey(key);
  return key;
}
