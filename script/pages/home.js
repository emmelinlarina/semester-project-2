import { getListings } from "../api/listings.js";
import { initNav } from "../utils/nav.js";
import {
  getHighestBid,
  renderGrid,
  skeletonCard,
  timeLeft,
  FALLBACK_IMAGE,
} from "../render/listing-card.js";

initNav();

function renderHome() {
  return `
      <section
          class="relative overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-100"
          aria-labelledby="weeklyTitle"
        >
          <div id="weeklyHighlight" class="min-h-72 sm:min-h-96 lg:min-h-130">

            <div class="p-6 sm:p-10 animate-pulse">
              <div class="h-6 w-40 bg-zinc-200 rounded"></div>
              <div class="mt-4 h-10 w-2/3 bg-zinc-200 rounded"></div>
              <div class="mt-3 h-5 w-1/2 bg-zinc-200 rounded"></div>
            </div>
          </div>
      </section>

      <section class="mt-10 font-rasa" aria-labelledby="highlightedTitle">
        <div class="flex items-center justify-between">
          <h2 id="highlightedTitle" class="text-xl font-semibold tracking-widest text-zinc-700">
            HIGHLIGHTED AUCTIONS
          </h2>
        </div>
        <div
          class="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 min-h-95"
          id="highlightedGrid"
          aria-label="Highlighted auctions"
        ></div>
      </section>

      <section class="mt-12 font-rasa" aria-labelledby="galleryTitle">
        <div class="flex items-center justify-between">
          <h2 id="galleryTitle" class="text-xl font-semibold tracking-widest text-zinc-700">
            GALLERY
          </h2>
          <p
            id="searchStatus"
            class="h-5 text-sm text-zinc-500 flex items-center justify-end"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          ></p>
        </div>

        <div class="flex items-center gap-2">
          <label for="sortSelect" class="text-xs text-zinc-500">SORT BY</label>
          <select
            id="sortSelect"
            class="rounded-full bg-zinc-100 border border-zinc-200 px-3 py-2 mb-2 mt-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 focus:ring-offset-white"
          >
            <option value="endsSoon">Ending soon</option>
            <option value="endsLate">Ending late</option>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>

        <form id="gallerySearchForm" class="flex items-center gap-2" role="search" aria-label="Search gallery">
        <label for="gallerySearchInput" class="sr-only">Search listings</label>
          <input
            type="search"
            id="gallerySearchInput"
            placeholder="Search gallery"
            class="w-full sm:w-56 rounded-full border border-zinc-200 bg-zinc-100 px-5 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-300"
            autocomplete="off"
            />

          <button
            type="submit"
            class="rounded-full bg-zinc-200 px-4 py-2 text-sm font-semibold hover:bg-zinc-300 transition focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 focus:ring-offset-white"
          >
            Search
          </button>

          <button
            id="galleryClearBtn"
            type="button"
            class="rounded-full bg-zinc-100 px-4 py-2 text-sm hover:bg-zinc-200 transition
            focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 focus:ring-offset-white"
          >
            Clear
          </button>
        </form>

        <div
          class="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          id="galleryGrid"
        ></div>
        
        <nav class="mt-6 flex items-center justify-center gap-4" aria-label="Pagination">
          <button
            id="prevBtn"
            class="rounded-full bg-zinc-200 px-6 py-2 text-sm font-semibold hover:bg-zinc-300 transition disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 focus:ring-offset-white"
            aria-label="Previous page"
            type="button"
          >
            Previous
          </button>

          <span id="pageNumber" class="text-sm font-semibold" aria-live="polite" aria-atomic="true">1</span>
          <button
            id="nextBtn"
            class="rounded-full bg-zinc-200 px-6 py-2 text-sm font-semibold hover:bg-zinc-300 transition disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 focus:ring-offset-white"
            aria-label="Next page"
            type="button"
          >
            Next
          </button>
        </nav>
      </section>
    `;
}

function mountHome() {
  const mount = document.getElementById("homeMount");
  if (!mount) throw new Error("Home mount not found");
  mount.innerHTML = renderHome();
}

mountHome();

const highlightedGrid = document.getElementById("highlightedGrid");
const galleryGrid = document.getElementById("galleryGrid");
const sortSelect = document.getElementById("sortSelect");

const searchStatus = document.getElementById("searchStatus");

const gallerySearchForm = document.getElementById("gallerySearchForm");
const gallerySearchInput = document.getElementById("gallerySearchInput");
const galleryClearBtn = document.getElementById("galleryClearBtn");

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const pageNumber = document.getElementById("pageNumber");

const LIMIT = 12;

let listings = [];
let galleryQuery = "";
let isGallerySearching = false;

let currentPage = 1;
let currentSort = "endsAt";
let currentOrder = "asc";

let highlightedListings = [];
let highlightedLoaded = false;

function pickHighlighted(items) {
  return [...items]
    .sort((a, b) => getHighestBid(b) - getHighestBid(a))
    .slice(0, 3);
}

function getISOWeekNumber(date = new Date()) {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

function pickWeeklyHighlights(items) {
  const active = (items || []).filter((x) => x?.endsAt && x?.title);

  if (!active.length) return null;

  const sorted = [...active].sort((a, b) => (a.id > b.id ? -1 : 1));

  const week = getISOWeekNumber(new Date());
  const index = week % sorted.length;

  return sorted[index];
}

function weeklyHeroTemplate(listing) {
  if (!listing) {
    return `
      <div class="p-6 sm:p-10">
      <p class="text-xs tracking-widest font-rasa text-zinc-500"
      >FEATURED THIS WEEK 
      </p>

        <h1 id="weeklyTitle" 
        class="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900">
          No featured auction this week
        </h1>

        <p class="mt-2 text-base text-zinc-600 max-w-xl"> 
        Check back later for new featured auctions.
        </p>
      </div>
    `;
  }

  const title = listing?.title ?? "Untitled";
  const bid = getHighestBid(listing);
  const time = timeLeft(listing?.endsAt);
  const image =
    listing?.media?.length > 0 && listing.media[0].url
      ? listing.media[0].url
      : FALLBACK_IMAGE;

  const href = `./single-listing.html?id=${listing.id}`;

  return `

  <a href="${href}" 
  class="group block relative min-h-72 sm:min-h-96 lg:min-h-130 rounded-3xl overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white/70">
  
  <div class="absolute inset-0">
    <img 
      src="${image}"
      alt="Image of ${title}"
      class="h-full w-full object-cover transition duration-700 group-hover:scale-105"
      loading="lazy"
      onerror='this.onerror=null;this.src="${FALLBACK_IMAGE}"'
    />

    <div class="absolute inset-0 from-black/80 via-black/40 to-transparent"></div>
    <div class="absolute inset-0 bg-black/10"></div>
  </div>

  <div class="relative h-full flex items-center justify-center mt-15">
    <div class="p-6 sm:p-10 max-w-2xl rounded-2xl bg-black/20 backdrop-blur-md border border-white/15 shadow-lg">

      <p class="text-lg tracking-[0.3em] text-white/80">
      FEATURED AUCTION THIS WEEK
      </p>

      <h1 id="weeklyTitle" 
      class="mt-2 text-3xl sm:text-4xl lg:text-5xl font-semibold text-white leading-tight">
        ${title}
      </h1>

      <div class="mt-3 flex flex-wrap gap-2">

        <span 
        class="rounded-full bg-white/15 px-4 py-1 text-sm text-white">
          ${time === "Ended" ? "Ended" : `Ends in ${time}`}
        </span>

        <span class="rounded-full bg-white/15 px-4 py-1 text-sm text-white backdrop-blur tabular-nums font-bold"> 
        Highest bid: ${bid} $
        </span>
      </div>

      <div class="pt-2">
      <span 
      class="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-zinc-900 transition group-hover:gap-3">
        View auction 
        <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
      </span>
      </div>
    </div>
  </div>
  </a>
`;
}

function updatePagerUI(count = listings.length) {
  if (pageNumber) pageNumber.textContent = `Page ${currentPage}`;

  if (isGallerySearching) {
    prevBtn && (prevBtn.disabled = true);
    nextBtn && (nextBtn.disabled = true);
    return;
  }

  prevBtn && (prevBtn.disabled = currentPage === 1);

  const noMorePages = count < LIMIT;
  nextBtn && (nextBtn.disabled = noMorePages);
}

function filterLocalListings(q) {
  const queryLower = (q || "").toLowerCase();
  if (!queryLower) return [];

  return listings.filter((item) => {
    const title = item.title?.toLowerCase() ?? "";
    const description = item.description?.toLowerCase() ?? "";
    return title.includes(queryLower) || description.includes(queryLower);
  });
}

function setBusy(el, busy) {
  if (!el) return;
  el.setAttribute("aria-busy", busy ? "true" : "false");
}

async function loadHighlighted() {
  if (!highlightedLoaded && highlightedGrid) {
    setBusy(highlightedGrid, true);
    highlightedGrid.innerHTML = skeletonCard(3);
  }

  const res = await getListings({
    limit: 30,
    page: 1,
    sort: "endsAt",
    sortOrder: "asc",
    active: true,
  });

  const items = res?.data ?? [];
  const weeklyHighlight = document.getElementById("weeklyHighlight");
  if (weeklyHighlight) {
    const weekly = pickWeeklyHighlights(items);
    weeklyHighlight.innerHTML = weeklyHeroTemplate(weekly);
  }

  highlightedListings = pickHighlighted(items);

  renderGrid(highlightedGrid, highlightedListings);
  setBusy(highlightedGrid, false);
  highlightedLoaded = true;
}

async function loadListings() {
  try {
    if (galleryGrid) {
      setBusy(galleryGrid, true);
      galleryGrid.innerHTML = skeletonCard(LIMIT);
    }

    const res = await getListings({
      limit: galleryQuery ? 100 : LIMIT,
      page: galleryQuery ? 1 : currentPage,
      sort: currentSort,
      sortOrder: currentOrder,
      active: true,
    });

    listings = res?.data ?? [];

    let displayItems = listings;
    if (isGallerySearching) {
      displayItems = filterLocalListings(galleryQuery);
    }

    if (!displayItems.length) {
      if (galleryGrid) {
        galleryGrid.innerHTML = `<p class="text-sm text-zinc-600" role="status">No listings found.</p>`;
        setBusy(galleryGrid, false);
      }
      updatePagerUI(0);
      return;
    }

    if (searchStatus) {
      if (galleryQuery) {
        searchStatus.textContent = `Showing results for "${galleryQuery}"`;
      } else {
        searchStatus.textContent = `Showing all active listings (Page ${currentPage})`;
      }
    }

    renderGrid(galleryGrid, displayItems);
    setBusy(galleryGrid, false);

    updatePagerUI();
  } catch (err) {
    console.error("Error loading listings:", err);
    if (galleryGrid) {
      galleryGrid.innerHTML = `<p class="text-sm text-red-600" role="alert">Error loading listings.</p>`;
      setBusy(galleryGrid, false);
    }
  }
}

sortSelect?.addEventListener("change", async () => {
  const value = sortSelect.value;

  if (value === "endsSoon") {
    currentSort = "endsAt";
    currentOrder = "asc";
  } else if (value === "endsLate") {
    currentSort = "endsAt";
    currentOrder = "desc";
  } else if (value === "newest") {
    currentSort = "created";
    currentOrder = "desc";
  } else if (value === "oldest") {
    currentSort = "created";
    currentOrder = "asc";
  }

  currentPage = 1;
  await loadListings();
});

prevBtn?.addEventListener("click", async () => {
  if (currentPage > 1) {
    currentPage--;
    await loadListings();
  }
});

nextBtn?.addEventListener("click", async () => {
  currentPage++;
  await loadListings();
});

gallerySearchForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  galleryQuery = gallerySearchInput.value.trim();
  isGallerySearching = Boolean(galleryQuery);
  currentPage = 1;
  await loadListings();
});

galleryClearBtn?.addEventListener("click", async () => {
  gallerySearchInput.value = "";
  galleryQuery = "";
  isGallerySearching = false;
  currentPage = 1;
  await loadListings();
});

loadHighlighted();
loadListings();
