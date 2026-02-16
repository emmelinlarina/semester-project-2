import { getListings } from "../api/listings.js";
import { ensureAPIKey } from "../api/auth.js";
import { initSearch } from "../utils/search.js";
import { initNav } from "../utils/nav.js";
import {
  getHighestBid,
  renderGrid,
  skeletonCard,
  cardTemplate,
} from "../render/listing-card.js";

const highlightedGrid = document.getElementById("highlightedGrid");
const galleryGrid = document.getElementById("galleryGrid");
const sortSelect = document.getElementById("sortSelect");

const searchStatus = document.getElementById("searchStatus");
const searchResults = document.getElementById("searchResults");

const gallerySearchForm = document.getElementById("gallerySearchForm");
const gallerySearchInput = document.getElementById("gallerySearchInput");
const galleryClearBtn = document.getElementById("galleryClearBtn");

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const pageNumber = document.getElementById("pageNumber");

//config
const LIMIT = 12;

// feed
let listings = [];
let searchPool = [];
let galleryQuery = "";
let isGallerySearching = false;
let navQuery = "";

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

  if (galleryQuery) {
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

function filterPool(q) {
  const queryLower = (q || "").toLowerCase();
  if (!queryLower) return [];
  return searchPool.filter((item) => {
    const title = item.title?.toLowerCase() ?? "";
    const description = item.description?.toLowerCase() ?? "";
    return title.includes(queryLower) || description.includes(queryLower);
  });
}

function renderSearchResults(items) {
  if (!searchResults) return;

  if (!items.length) {
    searchResults.innerHTML = `<p class="text-sm text-zinc-600">No results found.</p>`;
    return;
  }

  searchResults.innerHTML = items.slice(0, 10).map(cardTemplate).join("");
}

async function loadHighlighted() {
  if (!highlightedLoaded && highlightedGrid) {
    highlightedGrid.innerHTML = skeletonCard(3);
  }

  await ensureAPIKey();

  const res = await getListings({
    limit: 6,
    page: 1,
    sort: "endsAt",
    sortOrder: "asc",
    active: true,
  });

  const items = res?.data ?? [];
  highlightedListings = [...items]
    .sort((a, b) => getHighestBid(b) - getHighestBid(a))
    .slice(0, 3);

  renderGrid(highlightedGrid, highlightedListings);
  highlightedLoaded = true;
}

async function loadListings() {
  try {
    if (galleryGrid) galleryGrid.innerHTML = skeletonCard(LIMIT);

    await ensureAPIKey();

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

async function loadSearchPool() {
  try {
    await ensureAPIKey();

    const res = await getListings({
      limit: 100,
      page: 1,
      sort: "endsAt",
      sortOrder: "asc",
      active: true,
    });

    searchPool = res?.data ?? [];
  } catch (err) {
    console.error("Error loading search pool:", err);
    searchPool = [];
  }
}

//events
sortSelect?.addEventListener("change", async () => {
  const value = sortSelect.value;

  if (value === "endsSoon") {
    currentSort = "endsAt";
    currentOrder = "asc";
  }

  if (value === "endsLate") {
    currentSort = "endsAt";
    currentOrder = "desc";
  }

  if (value === "newest") {
    currentSort = "created";
    currentOrder = "desc";
  }

  if (value === "oldest") {
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

initSearch({
  onInput: (q) => {
    navQuery = (q || "").trim();
    const matches = filterPool(navQuery);
    renderSearchResults(matches);
  },
  onSubmit: (q) => {
    navQuery = (q || "").trim();
    const matches = filterPool(navQuery);
    renderSearchResults(matches);
  },
});

initNav();
await loadSearchPool();
loadHighlighted();
loadListings();
