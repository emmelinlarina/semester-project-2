import {
  getApiKey,
  getToken,
  getProfile,
  setProfile,
} from "../utils/storage.js";
import { apiFetch } from "./api-fetch.js";

export async function refreshProfile() {
  const token = getToken();
  if (!token) return null;

  const current = getProfile();
  const name = current?.name;
  if (!name) return null;

  const apiKey = getApiKey();
  const res = await apiFetch(`auction/profiles/${name}`, {
    headers: {
      ...(apiKey ? { "X-Noroff-API-Key": apiKey } : {}),
      Authorization: `Bearer ${token}`,
    },
  });

  const updated = res?.data ?? res;
  if (updated) setProfile(updated);
  return updated;
}

export async function updateCredits(amount) {
  const token = getToken();
  if (!token) throw new Error("User must be logged in to update credits");

  const current = getProfile();
  const name = current?.name;
  if (!name) throw new Error("Current user profile not found");

  const parsed = Number(amount);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("Amount must be a positive number");
  }

  const apiKey = getApiKey();

  const res = await apiFetch(`auction/profiles/${name}/credits`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { "X-Noroff-API-Key": apiKey } : {}),
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ amount: parsed }),
  });

  const updated = res?.data ?? res;
  if (updated) setProfile(updated);
  return updated;
}
