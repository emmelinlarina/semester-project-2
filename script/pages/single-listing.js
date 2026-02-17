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

  const media = listing?.media ?? [];
  const images = media.length
    ? media.map((m) => m.url).filter(Boolean)
    : ["https://via.placeholder.com/600x400?text=No+Image"];

  const endsAt = listing?.endsAt
    ? new Date(listing.endsAt).toLocaleString()
    : "N/A";
  const seller = listing?.seller?.name ?? "Unknown Seller";

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

        <div id="imgDots" class="flex items-center justify-center gap-2 p-3 bg-white/60">
          ${images
            .map(
              (_, index) => `
              <button 
                type="button"
                class="imgDot w-2.5 h-2.5 rounded-full ${index === 0 ? "bg-zinc-800" : "bg-zinc-400"}"
                data-index="${index}"
                aria-label="Go to image ${index + 1}"
              ></button>
            `,
            )
            .join("")}
        </div>
        </div>

        <div class="rounded-3xl border border-zinc-200 bg-white p-6">
            <div class="flex items-start justify-between gap-4">
                <h1 class="text-2xl sm:text-3xl font-semibold tracking-wide">${title}</h1>

                <div class="text-right">
                    <p class="text-sm text-gray-500">Highest Bid</p>
                    <p class="text-sm text-gray-500">${bid}</p>
                </div>
            </div>

            <p class="mt-4 text-gray-700 whitespace-pre-wrap">${description}</p>

            <div class="mt-6 grid grid-cols-2 gap-3 text-sm">
                <div class="rounded-2xl bg-zinc-50 border border-zinc-200 p-4"> 
                    <p class="text-gray-500">Seller</p>
                    <p class="font-medium">${seller}</p>
                </div>

                <div class="rounded-2xl bg-zinc-50 border border-zinc-200 p-4">
                    <p class="text-gray-500">Time Left</p>
                    <p class="font-medium">${time}</p>
                </div>
                    <div class="rounded-2xl bg-zinc-50 border border-zinc-200 p-4">
                    <p class="text-gray-500">Ends at</p>
                    <p class="font-medium">${endsAt}</p>
                </div>
            </div>

            <div class="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <p class="text-gray-500 mb-2">
            Place a bid comes here
            </p>
          </div>
        </div>
  </article>
    `;
}

function initGallery(images) {
  const imgEl = document.getElementById("listingImage");
  const prevBtn = document.getElementById("imgPrev");
  const nextBtn = document.getElementById("imgNext");
  const counter = document.getElementById("imageCounter");
  const dotsWrap = document.getElementById("imgDots");

  if (!imgEl || !prevBtn || !nextBtn || !counter || !dotsWrap) return;

  let index = 0;

  function render() {
    imgEl.src = images[index];
    counter.textContent = `${index + 1} / ${images.length}`;

    dotsWrap.querySelectorAll(".imgDot").forEach((dot) => {
      const dotIndex = Number(dot.dataset.index);
      dot.classList.toggle("bg-zinc-800", dotIndex === index);
      dot.classList.toggle("bg-zinc-400", dotIndex !== index);
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

  dotsWrap.addEventListener("click", (e) => {
    const btn = e.target.closest(".imgDot");
    if (!btn) return;
    const dotIndex = Number(btn.dataset.index);
    if (Number.isNaN(dotIndex)) return;
    index = dotIndex;
    render();
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") prev();
    else if (e.key === "ArrowRight") next();
  });

  render();
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

    const images = (listing?.media ?? []).map((m) => m.url).filter(Boolean);

    initGallery(
      images.length
        ? images
        : ["https://via.placeholder.com/600x400?text=No+Image"],
    );
  } catch (error) {
    listingRoot.innerHTML = `<p class="text-sm text-red-600">Error loading listing: ${error.message}</p>`;
  }
}

initNav();
loadSingleListing();
