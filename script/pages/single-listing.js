import { ensureAPIKey } from "../api/auth.js";
import { getListingsById } from "../api/listings.js";
import { initNav } from "../utils/nav.js";
import {
  getHighestBid,
  timeLeft,
  spinnerMarkup,
} from "../render/listing-card.js";

const listingRoot = document.getElementById("listingRoot");

function getIdFromURL() {
  return new URLSearchParams(window.location.search).get("id");
}

function singleListingTemplate(listing) {
  const title = listing?.title ?? "Untitled Listing";
  const description = listing?.description ?? "No description provided.";
  const bid = getHighestBid(listing);

  const time = timeLeft(listing?.endsAt);
  const image =
    listing?.media?.length > 0 && listing.media[0].url
      ? listing.media[0].url
      : "https://via.placeholder.com/600x400?text=No+Image";

  const endsAt = listing?.endsAt
    ? new Date(listing.endsAt).toLocaleString()
    : "N/A";
  const seller = listing?.seller?.name ?? "Unknown Seller";

  return `
        <a href="index.html" class="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900">
        
      </a>

      <article class="mt-6 grid gap-6 lg:grid-cols-2">
        <div class="rounded-3xl overflow-hidden border border-zinc-200 bg-zinc-100">
            <img 
            src="${image}" 
            alt="${title}" 
            class="w-full h-90 sm:h-110 object-cover bg-zinc-200"
            loading="lazy"
            onerror="this.src='https://via.placeholder.com/600x400?text=No+Image'"
        />
        </div>

        <div class="rounded-3xl border border-zinc-200 bg-white p-6">
            <div class="flex items-center justify-between gap-4">
                <h1 class="text-2xl sm:text-3xl font-semibold tracking-wide">${title}</h1>

                <div class="text-right">
                    <p class="text-sm text-zinc-500">Highest bid</p>
                    <p class="text-lg font-medium">${bid}</p>
                </div>
            </div>

            <p class="mt-3 text-zinc-700 leading-relaxed">
            ${description || "No description provided."}
            </p>

            <div class="mt-6 grid grid-cols-2 gap-3 text-sm">
                <div class="rounded-2xl bg-zinc-50 border border-zinc-200 p-4">
                <p class="text-zinc-500">Seller</p>
                <p class="font-medium">${seller}</p>
                </div>

                <div class="rounded-2xl bg-zinc-50 border border-zinc-200 p-4">
                <p class="text-zinc-500">Time Left</p>
                <p class="font-mono text-sm text-zinc-700">${time}</p>
                </div>

                <div class="rounded-2xl bg-zinc-50 border border-zinc-200 p-4">
                <p class="text-zinc-500">Ends at</p>
                <p class="font-medium">${endsAt}</p>
                </div>
            </div>
        </div>
        </article>
    `;
}

async function loadSingleListing() {
  const id = getIdFromURL();

  if (!listingRoot) return;

  if (!id) {
    listingRoot.innerHTML = `<p class="text-sm text-red-600">No listing ID provided in URL.</p>`;
    return;
  }

  listingRoot.innerHTML = spinnerMarkup("Loading listing...");

  try {
    await ensureAPIKey();
    const res = await getListingsById(id);
    const listing = res?.data ?? res;

    if (!listing) {
      listingRoot.innerHTML = `<p class="text-sm text-red-600">Listing not found.</p>`;
      return;
    }

    listingRoot.innerHTML = singleListingTemplate(listing);
  } catch (error) {
    listingRoot.innerHTML = `<p class="text-sm text-red-600">Error loading listing: ${error.message}</p>`;
  }
}

initNav();
loadSingleListing();
