import { getApiKey } from "../utils/storage.js";
import { apiFetch } from "./api-fetch.js";

export async function getListings({
  limit = 12,
  page = 1,
  sort = "endsAt",
  sortOrder = "asc",
  active = true,
  q = "",
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
  if (q) params.set("q", q);

  return apiFetch(`auction/listings?${params.toString()}`, {
    headers: apiKey ? { "X-Noroff-API-Key": apiKey } : {},
  });
}
