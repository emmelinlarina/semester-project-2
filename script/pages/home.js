import { getToken, getProfile, logout } from "../utils/storage.js";
import { getListings } from "../api/listings.js";
import { ensureAPIKey } from "../api/auth.js";

const menuBtn = document.getElementById("navMenu");
const mobileMenu = document.getElementById("mobileMenu");

//navbar elements
const navCreate = document.getElementById("navCreate");
const navLoggedOut = document.getElementById("navLoggedOut");
const navLoggedIn = document.getElementById("navLoggedIn");
const navCredits = document.getElementById("navCredits");

const mobileLoggedOut = document.getElementById("mobileLoggedOut");
const mobileLoggedIn = document.getElementById("mobileLoggedIn");
const mobileCredits = document.getElementById("mobileCredits");
const mobileCreditsTop = document.getElementById("mobileCreditsTop");

const logoutBtn = document.getElementById("logoutBtn");
const mobileLogoutBtn = document.getElementById("mobileLogoutBtn");
const mobileProfileIcon = document.getElementById("mobileProfileIcon");

// feed
const hightlightedGrid = document.getElementById("highlightedGrid");
const galleryGrid = document.getElementById("galleryGrid");
const sortSelect = document.getElementById("sortSelect");

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const pageNumber = document.getElementById("pageNumber");

const LIMIT = 12;

// Hamburger toggle
menuBtn?.addEventListener("click", () => {
  const isOpen = !mobileMenu.classList.contains("hidden");
  mobileMenu.classList.toggle("hidden");
  menuBtn.setAttribute("aria-expanded", String(!isOpen));
});

//navbar icons
function updateNav() {
  const token = getToken();
  const profile = getProfile();
  const credits = profile?.credits ?? 0;

  console.log("TOKEN:", token);

  navLoggedOut?.classList.add("hidden");
  navLoggedOut?.classList.remove("md:flex");

  navLoggedIn?.classList.add("hidden");
  navLoggedIn?.classList.remove("md:flex");

  navCreate?.classList.add("hidden");

  mobileLoggedOut?.classList.add("hidden");
  mobileLoggedIn?.classList.add("hidden");

  mobileProfileIcon?.classList.remove("hidden");
  mobileProfileIcon?.classList.add("inline-flex", "md:hidden");

  if (token) {
    navLoggedIn?.classList.remove("hidden");
    navLoggedIn?.classList.add("md:flex", "max-md:hidden");

    navCreate?.classList.remove("hidden");
    navCreate?.classList.add("md:inline-flex", "max-md:hidden");

    mobileLoggedIn?.classList.remove("hidden");

    mobileProfileIcon?.classList.remove("hidden");
    mobileProfileIcon?.classList.add("inline-flex", "md:hidden");

    if (navCredits) navCredits.textContent = `${credits} $`;
    if (mobileCredits) mobileCredits.textContent = String(credits);
    if (mobileCreditsTop) mobileCreditsTop.textContent = `${credits} $`;
  } else {
    navLoggedOut?.classList.remove("hidden");
    navLoggedOut?.classList.add("md:flex", "max-md:hidden");

    mobileLoggedOut?.classList.remove("hidden");
  }
}

function doLogout() {
  logout();
  window.location.href = "./login.html";
}

logoutBtn?.addEventListener("click", doLogout);
mobileLogoutBtn?.addEventListener("click", doLogout);

// feed
let listings = [];

function getHighestBid(listing) {
  const bids = listing.bids ?? [];
  return bids.reduce((max, bid) => (bid.amount > max ? bid.amount : max), 0);
}

function timeLeft(endTime) {
  const end = new Date(endTime);
  const diff = end - Date.now();
  if (diff <= 0) return "Ended";

  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${mins % 60}m`;
  return `${mins}m`;
}

function cardTemplate(listing) {
  const title = listing?.title ?? "Untitled";
  const description = listing?.description ?? "";
  const bid = getHighestBid(listing);
  const time = timeLeft(listing?.endsAt);
  const image =
    listing?.media?.length > 0 && listing.media[0].url
      ? listing.media[0].url
      : "https://via.placeholder.com/400x300?text=No+Image";

  return ` 
    <a href="./listing.html?id=${listing.id}" class="block rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
      <img src="${image}" alt="${title}" class="w-full h-48 object-cover">
      <div class="p-4">
        <h3 class="text-lg font-semibold mb-2">${title}</h3>
        <p class="text-sm text-gray-600 mb-4">${description}</p>
        <div class="flex items-center justify-between">
          <span class="text-sm font-bold">${bid} $</span>
          <span class="text-xs text-gray-500">${time}</span>
        </div>
      </div>
    </a>
  `;
}

function renderGrid(el, items) {
  if (!el) return;
  el.innerHTML = items.map(cardTemplate).join("");
}

// sorting
let currentPage = 1;
let currentSort = "endsAt";
let currentOrder = "asc";

function pickHighlighted(items) {
  return [...items]
    .sort((a, b) => getHighestBid(b) - getHighestBid(a))
    .slice(0, 3);
}

let highlightedListings = [];
let highlightedLoaded = false;

async function loadHighlighted() {
  if (highlightedLoaded) return;

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
    if (galleryGrid)
      galleryGrid.innerHTML = `<p class="text-sm text-zinc-600">Loading...</p>`;

    await ensureAPIKey();

    const res = await getListings({
      limit: LIMIT,
      page: currentPage,
      sort: currentSort,
      sortOrder: currentOrder,
      active: true,
    });

    listings = res?.data ?? [];

    if (!listings.length) {
      if (highlightedGrid) highlightedGrid.innerHTML = "";
      if (galleryGrid)
        galleryGrid.innerHTML = `<p class="text-sm text-zinc-600">No listings found.</p>`;
      updatePagerUI();
      return;
    }

    renderGrid(galleryGrid, listings);

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
  window.scrollTo({ top: 0, behavior: "smooth" });
  await loadListings();
});

function updatePagerUI() {
  if (pageNumber) pageNumber.textContent = String(currentPage);

  if (prevBtn) prevBtn.disabled = currentPage === 1;

  const noMorePages = listings.length < LIMIT;
  if (nextBtn) nextBtn.disabled = noMorePages;
}

prevBtn?.addEventListener("click", async () => {
  if (currentPage > 1) {
    currentPage--;
    await loadListings();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
});

nextBtn?.addEventListener("click", async () => {
  currentPage++;
  await loadListings();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

updateNav();
loadHighlighted();
loadListings();
