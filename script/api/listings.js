import { getApiKey } from "../utils/storage.js";
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
