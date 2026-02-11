import { getApiKey } from "../utils/storage.js";
import { apiFetch } from "./api-fetch.js";

export async function getListings({
  limit = 100,
  page = 1,
  sort = "created",
  sortOrder = "asc",
  active = true,
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

  if (active) params.set("active", "true");

  const endpoint = `auction/listings?${params.toString()}`;

  return apiFetch(endpoint, {
    headers: { "X-API-Key": apiKey } ? { "X-API-Key": apiKey } : {},
  });
}
