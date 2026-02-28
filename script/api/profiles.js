import {
  getApiKey,
  getToken,
  getProfile,
  setProfile,
} from "../utils/storage.js";
import { apiFetch } from "./api-fetch.js";

function assertName(name) {
  if (!name) throw new Error("Profile name is required");
}

function authHeaders() {
  const token = getToken();
  const apiKey = getApiKey();

  if (!token) throw new Error("User must be logged in");
  return {
    ...(apiKey ? { "X-Noroff-API-Key": apiKey } : {}),
    Authorization: `Bearer ${token}`,
  };
}

function authJsonHeaders() {
  return {
    "Content-Type": "application/json",
    ...authHeaders(),
  };
}

function maybeAuthHeaders() {
  const token = getToken();
  const apiKey = getApiKey();

  if (!token) return apiKey ? { "X-Noroff-API-Key": apiKey } : {};
  return {
    ...(apiKey ? { "X-Noroff-API-Key": apiKey } : {}),
    Authorization: `Bearer ${token}`,
  };
}

export function getProfileByName(
  name,
  { listings = false, wins = false } = {},
) {
  assertName(name);
  const params = new URLSearchParams();
  if (listings) params.set("_listings", "true");
  if (wins) params.set("_wins", "true");

  const qs = params.toString() ? `?${params.toString()}` : "";
  return apiFetch(`auction/profiles/${name}${qs}`, {
    headers: maybeAuthHeaders(),
  });
}

export function updateProfile(name, { bio, avatar, banner } = {}) {
  assertName(name);
  const body = {};
  if (bio !== undefined) body.bio = bio;
  if (avatar !== undefined) body.avatar = avatar;
  if (banner !== undefined) body.banner = banner;

  return apiFetch(`auction/profiles/${name}`, {
    method: "PUT",
    headers: authJsonHeaders(),
    body: JSON.stringify(body),
  });
}

export function getProfileListings(name, params = {}) {
  assertName(name);
  const search = new URLSearchParams({
    limit: String(params.limit || 12),
    page: String(params.page || 1),
    sort: params.sort || "created",
    sortOrder: params.sortOrder || "desc",
    _bids: "true",
    _seller: "true",
  });

  if (params.active) search.set("_active", "true");

  return apiFetch(`auction/profiles/${name}/listings?${search.toString()}`, {
    headers: maybeAuthHeaders(),
  });
}

export function getProfileBids(name, { listings = true } = {}) {
  assertName(name);
  const qs = listings ? "?_listings=true" : "";
  return apiFetch(`auction/profiles/${name}/bids${qs}`, {
    headers: authHeaders(),
  });
}

export function getProfileWins(name) {
  assertName(name);
  return apiFetch(`auction/profiles/${name}/wins`, {
    headers: authHeaders(),
  });
}

export async function refreshProfile() {
  const token = getToken();
  if (!token) return null;

  const current = getProfile();
  const name = current?.name;
  if (!name) return null;

  const res = await apiFetch(`auction/profiles/${name}`, {
    headers: authHeaders(),
  });

  const updated = res?.data ?? res;
  if (updated) setProfile(updated);
  return updated;
}

export async function updateCredits(amount) {
  const current = getProfile();
  const name = current?.name;
  if (!name) throw new Error("Current user profile not found");

  const parsed = Number(amount);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("Amount must be a positive number");
  }

  const res = await apiFetch(`auction/profiles/${name}/credits`, {
    method: "PUT",
    headers: authJsonHeaders(),
    body: JSON.stringify({ amount: parsed }),
  });

  const updated = res?.data ?? res;
  if (updated) setProfile(updated);
  return updated;
}
