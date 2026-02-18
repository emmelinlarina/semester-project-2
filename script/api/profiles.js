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
