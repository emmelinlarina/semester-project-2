import { getListings } from "../api/listings.js";
import { initNav } from "../utils/nav.js";
import {
  getHighestBid,
  renderGrid,
  skeletonCard,
} from "../render/listing-card.js";

initNav();

function renderHome() {
  return `
      <section
        class="rounded-3xl bg-zinc-100 border border-zinc-200 flex flex-col items-start justify-center px-6 py-4"
      >
        <h1 class="text-3xl sm:text-4xl md:text-5xl tracking-wide">BRAND</h1>
      </section>

      <!-- highlighted auctions -->
      <section class="mt-10 font-rasa">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold tracking-widest text-zinc-700">
            HIGHLIGHTED AUCTIONS
          </h2>
        </div>
        <div
          class="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 min-h-95"
          id="highlightedGrid"
        ></div>
      </section>

      <!-- gallery -->
      <section class="mt-12 font-rasa">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold tracking-widest text-zinc-700">
            GALLERY
          </h2>
          <p
            id="searchStatus"
            class="h-5 text-sm text-zinc-500 flex items-center justify-end"
          ></p>
        </div>

        <div class="flex items-center gap-2">
          <span class="text-xs text-zinc-500">SORT BY</span>
          <select
            id="sortSelect"
            class="rounded-full bg-zinc-100 border border-zinc-200 px-3 py-2 text-sm"
          >
            <option value="endsSoon">Ending soon</option>
            <option value="endsLate">Ending late</option>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>

        <!-- gallery search -->
        <form id="gallerySearchForm" class="flex items-center gap-2">
          <input
            type="search"
            id="gallerySearchInput"
            placeholder="Search gallery"
            class="w-full sm:w-56 rounded-full border border-zinc-200 bg-zinc-100 px-5 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-300"
          />
          <button
            type="submit"
            class="rounded-full bg-zinc-200 px-4 py-2 text-sm font-semibold hover:bg-zinc-300 transition"
          >
            Search
          </button>
          <button
            id="galleryClearBtn"
            type="button"
            class="rounded-full bg-zinc-100 px-4 py-2 text-sm hover:bg-zinc-200 transition"
          >
            Clear
          </button>
        </form>

        <div
          class="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          id="galleryGrid"
        ></div>
        <!-- Pagination -->
        <div class="mt-6 flex items-center justify-center gap-4">
          <button
            id="prevBtn"
            class="rounded-full bg-zinc-200 px-6 py-2 text-sm font-semibold hover:bg-zinc-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span id="pageNumber" class="text-sm font-semibold">1</span>
          <button
            id="nextBtn"
            class="rounded-full bg-zinc-200 px-6 py-2 text-sm font-semibold hover:bg-zinc-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
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

function updatePagerUI(count = listings.length) {
  if (pageNumber) pageNumber.textContent = String(currentPage);

  if (isGallerySearching) {
    if (prevBtn) prevBtn.disabled = true;
    if (nextBtn) nextBtn.disabled = true;
    return;
  }

  if (prevBtn) prevBtn.disabled = currentPage === 1;

  const noMorePages = count < LIMIT;
  if (nextBtn) nextBtn.disabled = noMorePages;
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

async function loadHighlighted() {
  if (!highlightedLoaded && highlightedGrid) {
    highlightedGrid.innerHTML = skeletonCard(3);
  }

  const res = await getListings({
    limit: 6,
    page: 1,
    sort: "endsAt",
    sortOrder: "asc",
    active: true,
  });

  const items = res?.data ?? [];
  highlightedListings = pickHighlighted(items);

  renderGrid(highlightedGrid, highlightedListings);
  highlightedLoaded = true;
}

async function loadListings() {
  try {
    if (galleryGrid) galleryGrid.innerHTML = skeletonCard(LIMIT);

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
      if (galleryGrid)
        galleryGrid.innerHTML = `<p class="text-sm text-zinc-600">No listings found.</p>`;
      updatePagerUI(0);
      return;
    }

    if (searchStatus) {
      searchStatus.textContent = galleryQuery
        ? `Search results for "${galleryQuery}"`
        : "Showing all listings";
    }

    renderGrid(galleryGrid, displayItems);

    updatePagerUI();
  } catch (err) {
    console.error("Error loading listings:", err);
    if (galleryGrid)
      galleryGrid.innerHTML = `<p class="text-sm text-red-600">Error loading listings.</p>`;
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
