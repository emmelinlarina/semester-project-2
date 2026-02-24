import { getListings } from "../api/listings.js";
import { cardTemplate } from "../render/listing-card.js";

const searchToggle = document.getElementById("searchToggle");
const searchOverlay = document.getElementById("searchOverlay");
const searchInput = document.getElementById("searchInput");
const searchForm = document.getElementById("searchForm");

//toggle search
export function initSearch({
  onInput,
  onSubmit,
  resultsPage = "./index.html",
}) {
  const searchToggle = document.getElementById("searchToggle");
  const searchOverlay = document.getElementById("searchOverlay");
  const searchInput = document.getElementById("searchInput");
  const searchForm = document.getElementById("searchForm");
  if (!searchToggle || !searchOverlay || !searchInput || !searchForm) return;

  if (searchToggle.dataset.bound === "true") return;
  searchToggle.dataset.bound = "true";

  function open() {
    searchOverlay?.classList.remove("hidden");
    document.body.classList.add("overflow-hidden");
    searchToggle.setAttribute("aria-expanded", "true");
    searchInput?.focus();
    onInput?.(searchInput?.value ?? "");
  }

  function close() {
    searchOverlay?.classList.add("hidden");
    document.body.classList.remove("overflow-hidden");
    searchToggle.setAttribute("aria-expanded", "false");
  }

  searchToggle?.addEventListener("click", open);

  searchInput?.addEventListener("input", (e) => {
    onInput?.(e.target.value ?? "");
  });

  searchForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = (searchInput?.value || "").trim();

    if (onSubmit) {
      onSubmit(q);
      return;
    }

    if (!q) return;
    const url = new URL(resultsPage, window.location.href);
    url.searchParams.set("q", q);
    window.location.href = url.toString();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  searchOverlay?.addEventListener("click", (e) => {
    if (e.target === searchOverlay) close();
  });
}

let searchPool = null;

async function loadPool() {
  if (searchPool) return searchPool;

  try {
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

  return searchPool;
}

function filterPool(q) {
  const query = (q || "").trim().toLowerCase();
  if (!query) return [];

  return (searchPool || []).filter((item) => {
    const title = item.title?.toLowerCase() ?? "";
    const description = item.description?.toLowerCase() ?? "";
    return title.includes(query) || description.includes(query);
  });
}

function renderResults(items) {
  const root = document.getElementById("searchResults");
  if (!root) return;

  if (!items.length) {
    root.innerHTML = `<p class="text-sm text-zinc-600"></p>`;
    return;
  }

  root.innerHTML = items.slice(0, 10).map(cardTemplate).join("");
}

export async function handleSearchInput(q) {
  await loadPool();
  renderResults(filterPool(q));
}

export async function handleSearchSubmit(q) {
  await loadPool();
  renderResults(filterPool(q));
}
