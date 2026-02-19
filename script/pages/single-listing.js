import { ensureAPIKey } from "../api/auth.js";
import { getToken, getProfile } from "../utils/storage.js";
import { getListingsById, placeBid } from "../api/listings.js";
import { initNav } from "../utils/nav.js";
import {
  getHighestBid,
  timeLeft,
  spinnerMarkup,
} from "../render/listing-card.js";
import { refreshProfile } from "../api/profiles.js";

const listingRoot = document.getElementById("listingRoot");

function getIdFromURL() {
  return new URLSearchParams(window.location.search).get("id");
}

function singleListingTemplate(listing) {
  const title = listing?.title ?? "Untitled Listing";
  const description = listing?.description ?? "No description provided.";

  const seller = listing?.seller?.name ?? "Unknown Seller";

  const isEnded = listing?.endsAt
    ? new Date(listing.endsAt) <= new Date()
    : false;

  const token = getToken();
  const profile = getProfile();
  const isOwner = Boolean(profile?.name && seller && profile.name === seller);
  const bidDisabled = !token || isEnded || isOwner;

  const bid = getHighestBid(listing);
  const time = timeLeft(listing?.endsAt);

  const media = listing?.media ?? [];
  const images = media.length
    ? media.map((m) => m.url).filter(Boolean)
    : ["https://via.placeholder.com/600x400?text=No+Image"];

  const endsAt = listing?.endsAt
    ? new Date(listing.endsAt).toLocaleString()
    : "N/A";

  const bids = Array.isArray(listing?.bids) ? listing.bids : [];

  const highestBid = Number(getHighestBid(listing)) || 0;
  return `
    
  <article class="mt-6 grid gap-6 lg:grid-cols-2">
      <div class="rounded-3xl overflow-hidden border border-zinc-200 bg-zinc-100">
          <div class="relative">
            <img
            id="listingImage"
              src="${images[0]}"
              alt="${title}"
              class="w-full h-90 sm:h-110 object-cover bg-zinc-100"
              loading="lazy"
              onerror="this.src='https://via.placeholder.com/600x400?text=No+Image'"
          />
          
            <button 
            id="imgPrev"
            type="button"
            class="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 hover:bg-white p-2 shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-500"
            aria-label="Previous Image"
            >
              <i class="fas fa-chevron-left"></i>
            </button>

            <button
            id="imgNext"
            type="button"
            class="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 hover:bg-white p-2 shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-500"
            aria-label="Next Image"
            >
              <i class="fas fa-chevron-right"></i>
            </button>

            <div 
            id="imageCounter"
            class="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full"
            >
              ${1} / ${images.length}
          </div>
        </div>

        <div id="imgThumbs" class="grid grid-cols-4 gap-2 p-3 bg-white/60">
          ${images
            .map(
              (url, index) => `
              <button 
                type="button"
                class="imgThumb rounded-xl overflow-hidden border border-zinc-200 ${
                  index === 0 ? "ring-2 ring-zinc-800" : ""
                }"
                data-index="${index}"
                aria-label="Open image ${index + 1}"
              >
              <img 
                src="${url}"
                alt="Thumbnail ${index + 1}"
                class="w-full h-20 object-cover bg-zinc-200"
                loading="lazy"
                onerror="this.src='https://via.placeholder.com/150?text=No+Image'"
              />
              </button>
            `,
            )
            .join("")}
        </div>
        </div>

        <div class="rounded-3xl border border-zinc-200 bg-white p-6">
            <div class="flex items-start justify-between gap-4">
                <h1 class="text-2xl sm:text-3xl font-semibold tracking-wide">${title}</h1>
                

                <div class="grid gap-3 w-48">
                  <div class="rounded-2xl bg-zinc-50 border border-zinc-200 px-4 py-3 text-center">
                      <p class="text-xs uppercase tracking-widest text-gray-500">Highest Bid</p>
                      <p class="mt-1 text-2xl font-bold text-gray-500">${bid}</p>
                  </div>
                  <div class="rounded-2xl bg-zinc-50 border border-zinc-200 px-4 py-3 text-center">
                            <p class="text-xs uppercase tracking-widest text-gray-500">Time Left</p>
                            <p class="mt-1 text-2xl font-bold text-gray-500">${time}</p>
                  </div>
                </div>
            </div>

            <p class="mt-4 text-gray-700 whitespace-pre-wrap">${description}</p>
            

            <div class="mt-6 grid grid-cols-2 gap-3 text-sm">
                <div class="rounded-2xl bg-zinc-50 border border-zinc-200 p-4"> 
                    <p class="text-gray-500">Seller</p>
                    <p class="font-medium">${seller}</p>
                </div>

                
                    <div class="rounded-2xl bg-zinc-50 border border-zinc-200 p-4">
                    <p class="text-gray-500">Ends at</p>
                    <p class="font-medium">${endsAt}</p>
                </div>
            </div>

          
            <div class="mt-6 rounded-2xl border border-zinc-200 bg-white p-4">
                <div class="flex items-center justify-between gap-4">
                  <p class="text-sm text-gray-500 mb-3">
                  Place a bid
                  </p>
                  <span class="text-xs px-2 py-1 rounded-full border border-zinc-200">
                      ${isEnded ? "Ended" : "Active"}
                  </span>
                </div>

                ${
                  isEnded
                    ? `<p class="text-xs text-red-600 mt-1">Auction Ended</p>`
                    : isOwner
                      ? `<p class="text-xs text-zinc-600 mt-1">You own this listing - bidding disabled. </p>`
                      : ""
                }

                <p class="text-xs text-zinc-500 mt-1">
                    Minimum bid: <span class="font-semibold">${highestBid + 1} $</span>
                </p>

                <form id="bidForm" class="mt-3 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
                    <input
                    id="bidAmount"
                    type="number"
                    min="${highestBid + 1}"
                    step="1"
                    class="w-full rounded-lg border border-zinc-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                    placeholder="${!token ? "Login to place a bid" : isOwner ? "Owners can't bid on their own listing" : isEnded ? "Auction ended" : "Enter your bid amount"}"
                    ${bidDisabled ? "disabled" : ""}
                    />

                    <button
                    id ="bidSubmit"
                    type="submit"
                    class="rounded-lg bg-zinc-800 text-white px-4 py-2 hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-500 disabled:bg-zinc-400 disabled:cursor-not-allowed"
                    ${bidDisabled ? "disabled" : ""}
                    >
                    Place Bid
                    </button>
                </form>

                <p id="bidMsg" class="text-sm mt-3"></p>

                <div class="mt-6">
                    <div class="flex items-center justify-between">
                        <p class="text-sm font-medium text-gray-900">Bid History</p>
                        <p class="text-xs text-zinc-500">${bids.length} bids</p>
                    </div>

                    <div id="bidHistory" class="mt-3 grid gap-3 max-h-64 overflow-y-auto">
                        ${renderBidHistory(bids)}
                    </div>
                </div>
            </div>
  </article>
    `;
}

function formatWhen(iso) {
  if (!iso) return "N/A";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return "";
  }
}

function renderBidHistory(bids = []) {
  if (!Array.isArray(bids) || !bids.length) {
    return `<p class="text-sm text-gray-500">No bids placed yet.</p>`;
  }

  const sorted = [...bids].sort((a, b) => {
    const aT = new Date(a?.createdAt ?? a?.created ?? 0).getTime();
    const bT = new Date(b?.createdAt ?? b?.created ?? 0).getTime();
    return bT - aT;
  });

  return sorted
    .map((b) => {
      const name = b?.bidder?.name ?? "Unknown Bidder";
      const amount = Number(b?.amount) || 0;
      const t = formatWhen(b?.createdAt ?? b?.created);

      return `
        <div class="rounded-2xl border border-zinc-200 bg-white px-4 py-3 flex items-center justify-between gap-4">
          <div class="min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate">${name}</p>
            <p class="text-sm text-gray-500">${t}</p>
          </div>
          <p class="text-sm font-semibold text-gray-900">${amount} $</p>
        </div>
      `;
    })
    .join("");
}

function initGallery(images) {
  const imgEl = document.getElementById("listingImage");
  const prevBtn = document.getElementById("imgPrev");
  const nextBtn = document.getElementById("imgNext");
  const counter = document.getElementById("imageCounter");
  const thumbsWrap = document.getElementById("imgThumbs");

  if (!imgEl || !prevBtn || !nextBtn || !counter || !thumbsWrap) return;

  let index = 0;

  function render() {
    imgEl.src = images[index];
    counter.textContent = `${index + 1} / ${images.length}`;

    thumbsWrap.querySelectorAll(".imgThumb").forEach((thumb) => {
      const thumbIndex = Number(thumb.dataset.index);
      const active = thumbIndex === index;

      thumb.classList.toggle("ring-2", active);
      thumb.classList.toggle("ring-zinc-800", active);
    });

    const disabled = images.length <= 1;
    prevBtn.disabled = disabled;
    nextBtn.disabled = disabled;

    prevBtn.classList.toggle("cursor-not-allowed", disabled);
    prevBtn.classList.toggle("opacity-50", disabled);
    prevBtn.classList.toggle("hidden", images.length <= 1);

    nextBtn.classList.toggle("cursor-not-allowed", disabled);
    nextBtn.classList.toggle("opacity-50", disabled);
    nextBtn.classList.toggle("hidden", images.length <= 1);
  }

  function prev() {
    index = (index - 1 + images.length) % images.length;
    render();
  }

  function next() {
    index = (index + 1) % images.length;
    render();
  }

  prevBtn.addEventListener("click", prev);
  nextBtn.addEventListener("click", next);

  thumbsWrap.addEventListener("click", (e) => {
    const btn = e.target.closest(".imgThumb");
    if (!btn) return;
    const thumbIndex = Number(btn.dataset.index);
    if (Number.isNaN(thumbIndex)) return;
    index = thumbIndex;
    render();
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") prev();
    else if (e.key === "ArrowRight") next();
  });

  render();
}

function initBidSubmit(listingId, listing) {
  const form = document.getElementById("bidForm");
  const input = document.getElementById("bidAmount");
  const msg = document.getElementById("bidMsg");
  const btn = document.getElementById("bidSubmit");

  if (!form || !input || !msg) return;

  const token = getToken();
  const profile = getProfile();
  const sellerName = listing?.seller?.name ?? null;

  const isOwner = Boolean(
    profile?.name && sellerName && profile.name === sellerName,
  );
  const isEnded = listing?.endsAt
    ? new Date(listing.endsAt) <= new Date()
    : false;

  if (!token || isOwner || isEnded) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    msg.textContent = "";
    msg.className = "text-sm mt-3";

    const raw = input.value.trim();

    if (!raw) {
      msg.textContent = "Please enter a bid amount.";
      msg.classList.add("text-red-600");
      return;
    }

    const amount = Number(raw);
    if (!Number.isFinite(amount) || amount <= 0) {
      msg.textContent = "Please enter a valid bid amount.";
      msg.classList.add("text-red-600");
      return;
    }

    if (!Number.isInteger(amount)) {
      msg.textContent = "Bid amount must be a whole number.";
      msg.classList.add("text-red-600");
      return;
    }

    const highestBidNum = Number(getHighestBid(listing)) || 0;
    const minBid = highestBidNum + 1;

    if (amount < minBid) {
      msg.textContent = `Bid must be at least ${minBid} $.`;
      msg.classList.add("text-red-600");
      return;
    }

    if (btn) btn.disabled = true;

    try {
      await ensureAPIKey();
      await placeBid(listingId, amount);

      msg.textContent = "Bid placed successfully!";
      msg.classList.add("text-green-600");

      const updated = await refreshProfile();
      console.log("updated profile:", updated);
      initNav();

      input.value = "";

      const res = await getListingsById(listingId);
      const fresh = res?.data ?? res;

      listingRoot.innerHTML = singleListingTemplate(fresh);

      const images = (fresh?.media ?? []).map((m) => m.url).filter(Boolean);
      initGallery(
        images.length
          ? images
          : ["https://via.placeholder.com/600x400?text=No+Image"],
      );

      initBidSubmit(listingId, fresh);
    } catch (error) {
      const lower = String(error?.message || "").toLowerCase();

      if (
        lower.includes("credit") ||
        lower.includes("credits") ||
        lower.includes("insufficient")
      ) {
        msg.textContent = "Not enough credits to place this bid.";
      } else if (lower.includes("ended") || lower.includes("expired")) {
        msg.textContent = "Auction has already ended.";
      } else {
        msg.textContent = `Error placing bid: ${error?.message}`;
      }

      msg.classList.add("text-red-600");

      try {
        const res = await getListingsById(listingId);
        const fresh = res?.data ?? res;

        if (fresh?.endsAt && new Date(fresh.endsAt) <= new Date()) {
          listingRoot.innerHTML = singleListingTemplate(fresh);

          const images = (fresh?.media ?? []).map((m) => m.url).filter(Boolean);
          initGallery(
            images.length
              ? images
              : ["https://via.placeholder.com/600x400?text=No+Image"],
          );

          initBidSubmit(listingId, fresh);
          return;
        }
      } catch {
        // ignore
      }
      if (btn) btn.disabled = false;
    }
  });
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
    const res = await getListingsById(id);
    const listing = res?.data ?? res;

    if (!listing) {
      listingRoot.innerHTML = `<p class="text-sm text-red-600">Listing not found.</p>`;
      return;
    }

    listingRoot.innerHTML = singleListingTemplate(listing);

    const images = (listing?.media ?? []).map((m) => m.url).filter(Boolean);

    initGallery(
      images.length
        ? images
        : ["https://via.placeholder.com/600x400?text=No+Image"],
    );

    initBidSubmit(id, listing);
  } catch (error) {
    listingRoot.innerHTML = `<p class="text-sm text-red-600">Error loading listing: ${error?.message}</p>`;
  }
}

initNav();
loadSingleListing();
