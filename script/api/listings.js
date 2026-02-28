import { getApiKey, getToken } from "../utils/storage.js";
import { apiFetch } from "./api-fetch.js";

export async function getListings({
  limit = 12,
  page = 1,
  sort = "endsAt",
  sortOrder = "asc",
  active = true,
  q: query,
} = {}) {
  const apiKey = getApiKey();

  const params = new URLSearchParams({
    limit: String(limit),
    page: String(page),
    sort,
    sortOrder,
    _bids: "true",
    _seller: "true",
  });

  if (active) params.set("_active", "true");
  if (query) params.set("q", query);
  console.log("Listings url:", `auction/listings?${params.toString()}`);

  return apiFetch(`auction/listings?${params.toString()}`, {
    headers: apiKey ? { "X-Noroff-API-Key": apiKey } : {},
  });
}

export async function getListingsById(id) {
  if (!id) throw new Error("Listing ID is required");

  const apiKey = getApiKey();

  return apiFetch(`auction/listings/${id}?_bids=true&_seller=true`, {
    headers: apiKey ? { "X-Noroff-API-Key": apiKey } : {},
  });
}

export async function placeBid(listingId, amount) {
  if (!listingId) throw new Error("Listing ID is required");
  if (!Number.isFinite(amount))
    throw new Error("Bid amount must be a valid number");

  const token = getToken();
  if (!token) throw new Error("User must be logged in to place a bid");

  const apiKey = getApiKey();
  return apiFetch(`auction/listings/${listingId}/bids`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { "X-Noroff-API-Key": apiKey } : {}),
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ amount }),
  });
}

export async function createListing({ title, description, endsAt, media }) {
  if (!title?.trim()) throw new Error("Title is required");
  if (!description?.trim()) throw new Error("Description is required");
  if (!endsAt) throw new Error("End date/time is required");

  const token = getToken();
  if (!token) throw new Error("User must be logged in to create a listing");

  const apiKey = getApiKey();

  const end = new Date(endsAt);
  if (Number.isNaN(end.getTime())) throw new Error("Invalid end date");
  if (end <= new Date()) throw new Error("End date must be in the future");

  const cleanedMedia = Array.isArray(media)
    ? media
        .filter(Boolean)
        .map((m) => (typeof m === "string" ? { url: m } : m))
        .filter((m) => m.url)
    : [];

  return apiFetch(`auction/listings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { "X-Noroff-API-Key": apiKey } : {}),
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: title.trim(),
      description: description.trim(),
      media: cleanedMedia,
      endsAt: end.toISOString(),
    }),
  });
}

export async function updateListing(
  id,
  { title, description, endsAt, media } = {},
) {
  if (!id) throw new Error("Listing ID is required");

  const token = getToken();
  if (!token) throw new Error("User must be logged in to update a listing");

  const apiKey = getApiKey();
  const payload = {};

  if (typeof title === "string") {
    const t = title.trim();
    if (!t) throw new Error("Title cannot be empty");
    payload.title = t;
  }

  if (typeof description === "string") {
    const d = description.trim();
    if (!d) throw new Error("Description cannot be empty");
    payload.description = d;
  }

  if (endsAt !== undefined) {
    const end = new Date(endsAt);
    if (Number.isNaN(end.getTime())) throw new Error("Invalid end date");
    if (end <= new Date()) throw new Error("End date must be in the future");
    payload.endsAt = end.toISOString();
  }

  if (media !== undefined) {
    const cleanedMedia = Array.isArray(media)
      ? media
          .filter(Boolean)
          .map((m) => (typeof m === "string" ? { url: m } : m))
          .filter((m) => m.url)
      : [];
    payload.media = cleanedMedia;
  }

  return apiFetch(`auction/listings/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { "X-Noroff-API-Key": apiKey } : {}),
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function deleteListing(id) {
  if (!id) throw new Error("Listing ID is required");

  const token = getToken();
  if (!token) throw new Error("User must be logged in to delete a listing");

  const apiKey = getApiKey();

  return apiFetch(`auction/listings/${id}`, {
    method: "DELETE",
    headers: {
      ...(apiKey ? { "X-Noroff-API-Key": apiKey } : {}),
      Authorization: `Bearer ${token}`,
    },
  });
}
