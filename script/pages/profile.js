import { requireAuth } from "../utils/guard.js";
import { initNav } from "../utils/nav.js";
import { getProfile } from "../utils/storage.js";
import {
  refreshProfile,
  getProfileByName,
  getProfileListings,
  getProfileBids,
  updateProfile,
} from "../api/profiles.js";
import { uploadImage } from "../utils/cloudinary.js";
import { skeletonCard } from "../render/listing-card.js";
import { getListingsById } from "../api/listings.js";

requireAuth();

const creditsValue = document.getElementById("creditsValue");
const btn = document.getElementById("refreshCredits");
const msg = document.getElementById("creditsMsg");

const titleEl = document.getElementById("profileTitle");
const bioEl = document.getElementById("profileBio");
const avatarEl = document.getElementById("profileAvatar");
const bannerEl = document.getElementById("profileBanner");

const tabBtns = document.querySelectorAll(".tabBtn");
const tabListings = document.getElementById("tabListings");
const tabBids = document.getElementById("tabBids");

const myListingsGrid = document.getElementById("myListingsGrid");
const myBidsGrid = document.getElementById("myBidsGrid");

const editProfileBtn = document.getElementById("editProfileBtn");
const editProfileModal = document.getElementById("editProfile");
const editProfileClose = document.getElementById("editProfileClose");
const editCancel = document.getElementById("editCancel");
const editProfileForm = document.getElementById("editProfileForm");
const editBio = document.getElementById("editBio");
const editAvatar = document.getElementById("editAvatar");
const editBanner = document.getElementById("editBanner");
const editProfileMsg = document.getElementById("editProfileMsg");

function getCurrentName() {
  const p = getProfile();
  const name = p?.name;
  if (!name) throw new Error("User profile not found");
  return name;
}

function unwrapListing(res) {
  let x = res;

  for (let i = 0; i < 3; i++) {
    if (x && typeof x === "object" && "data" in x) x = x.data;
    else break;
  }
  return x;
}

function setImgFallback(imgEl, url, fallbackText = "No image") {
  if (!imgEl) return;
  if (url) {
    imgEl.src = url;
  } else {
    imgEl.removeAttribute("src");
    imgEl.alt = fallbackText;
  }
}

function renderCredits() {
  const profile = getProfile();
  creditsValue.textContent = String(profile?.credits ?? "0");
}

function showSkeletons(gridEl, count = 6) {
  if (!gridEl) return;
  gridEl.innerHTML = Array.from({ length: count }, () => skeletonCard()).join(
    "",
  );
}

function emptyState(title, text) {
  return `
    <div class="col-span-full rounded-3xl bg-zinc-50 p-6 text-center">
      <h2 class="text-xl font-semibold">${title}</h2>
      <p class="mt-2 text-gray-600">${text}</p>
    </div>
  `;
}

function listingCard(listing) {
  const id = listing?.id;
  const title = listing?.title ?? "Untitled";
  const endsAt = listing?.endsAt
    ? new Date(listing.endsAt).toLocaleString()
    : "N/A";

  const media = Array.isArray(listing?.media) ? listing.media : [];
  const img =
    media?.[0]?.url || "https://via.placeholder.com/400x300?text=No+Image";

  const highest =
    Array.isArray(listing?.bids) && listing.bids.length
      ? Math.max(...listing.bids.map((b) => Number(b.amount) || 0))
      : 0;

  return `
    <a href="./single-listing.html?id=${encodeURIComponent(id)}" class="block rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
      <div class="h-48 bg-zinc-100">
        <img src="${img}" alt="${title}" class="w-full h-full object-cover" loading="lazy" />
      </div>
      <div class="p-4">
      <p class="line-clamp-1 text-sm font-semibold">${title}</p>
      <p class="text-sm text-gray-600">Current bid: ${highest} $</p>
      <p class="text-xs text-gray-500">Ends at: ${endsAt}</p>
    </div>
  </a>
`;
}

const cache = { listings: null, bids: null };

function setActiveTab(tab) {
  tabListings?.classList.toggle("hidden", tab !== "listings");
  tabBids?.classList.toggle("hidden", tab !== "bids");

  tabBtns.forEach((btn) => {
    const active = btn.dataset.tab === tab;
    btn.classList.toggle("bg-zinc-100", active);
    btn.classList.toggle("border-zinc-300", active);
  });
}

async function loadBaseProfile() {
  const name = getCurrentName();
  const res = await getProfileByName(name);
  const profile = res?.data ?? res;

  titleEl.textContent = profile?.name ?? "Unknown User";
  bioEl.textContent = profile?.bio?.trim() ? profile.bio : "No bio yet.";

  setImgFallback(avatarEl, profile?.avatar?.url, "Profile avatar");
  setImgFallback(bannerEl, profile?.banner?.url, "Profile banner");
}

async function loadListingsOnce() {
  if (cache.listings) return cache.listings;

  cache.listings = (async () => {
    showSkeletons(myListingsGrid, 6);
    const name = getCurrentName();

    const res = await getProfileListings(name, { limit: 12, page: 1 });
    const listings = res?.data ?? res ?? [];

    if (!Array.isArray(listings) || listings.length === 0) {
      myListingsGrid.innerHTML = emptyState(
        "No listings yet",
        "You haven't created any listings. Start selling your items now!",
      );
      return [];
    }

    myListingsGrid.innerHTML = listings.map(listingCard).join("");
    return listings;
  })();

  return cache.listings;
}

async function loadBidsOnce() {
  if (cache.bids) return cache.bids;

  cache.bids = (async () => {
    showSkeletons(myBidsGrid, 6);
    const name = getCurrentName();

    const res = await getProfileBids(name, { listings: true });
    const bids = res?.data ?? res ?? [];

    if (!Array.isArray(bids) || bids.length === 0) {
      myBidsGrid.innerHTML = emptyState(
        "No bids yet",
        "You haven't placed any bids. Start exploring listings and place your first bid!",
      );
      return [];
    }

    const uniqueIds = [
      ...new Set(bids.map((b) => b.listing?.id).filter(Boolean)),
    ];

    const fullListings = await Promise.all(
      uniqueIds.map(async (id) => {
        try {
          const res = await getListingsById(id);
          return unwrapListing(res);
        } catch (error) {
          return null;
        }
      }),
    );

    const resolved = fullListings.filter(Boolean);

    if (resolved.length === 0) {
      myBidsGrid.innerHTML = emptyState(
        "No bids yet",
        "You haven't placed any bids. Start exploring listings and place your first bid!",
      );
      return [];
    }

    myBidsGrid.innerHTML = resolved.map(listingCard).join("");
    return resolved;
  })();

  return cache.bids;
}

async function handleTabClick(tab) {
  setActiveTab(tab);

  try {
    if (tab === "listings") await loadListingsOnce();
    if (tab === "bids") await loadBidsOnce();
  } catch (error) {
    const box = tab === "listings" ? myListingsGrid : myBidsGrid;
    if (box) {
      box.innerHTML = `<div class="col-span-full rounded-3xl bg-red-50 p-6 text-center">
        <h2 class="text-xl font-semibold text-red-700">Error loading ${tab}</h2>
        <p class="mt-2 text-red-600">${error?.message || "An error occurred while loading data."}</p>
      </div>`;
    }
  }
}

function openEditModal() {
  const current = getProfile();

  editBio.value = current?.bio ?? "";
  editAvatar.value = "";
  editBanner.value = "";

  editProfileMsg.textContent = "";
  editProfileMsg.className = "text-sm";

  editProfileModal.classList.remove("hidden");
  editProfileModal.classList.add("flex");
  editProfileModal.setAttribute("aria-hidden", "false");
}

function closeEditModal() {
  editProfileModal.classList.add("hidden");
  editProfileModal.classList.remove("flex");
  editProfileModal.setAttribute("aria-hidden", "true");
}

function isValidUrlorEmpty(value) {
  const v = value.trim();
  if (!v) return true;
  try {
    new URL(v);
    return true;
  } catch {
    return false;
  }
}

editProfileBtn?.addEventListener("click", openEditModal);
editProfileClose?.addEventListener("click", closeEditModal);
editCancel?.addEventListener("click", closeEditModal);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !editProfileModal.classList.contains("hidden")) {
    closeEditModal();
  }
});

// save
editProfileForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = getCurrentName();
  const bio = editBio.value;

  const current = getProfile();

  const avatarFile = editAvatar.files[0] ?? null;
  const bannerFile = editBanner.files[0] ?? null;

  editProfileMsg.textContent = "Saving...";
  editProfileMsg.className = "text-zinc-600 text-sm";

  try {
    const [newAvatarUrl, newBannerUrl] = await Promise.all([
      avatarFile ? uploadImage(avatarFile) : Promise.resolve(null),
      bannerFile ? uploadImage(bannerFile) : Promise.resolve(null),
    ]);

    const avatarUrl = newAvatarUrl || current?.avatar?.url || "";
    const bannerUrl = newBannerUrl || current?.banner?.url || "";

    await updateProfile(name, {
      bio,
      avatar: avatarUrl ? { url: avatarUrl } : null,
      banner: bannerUrl ? { url: bannerUrl } : null,
    });

    await refreshProfile();
    await loadBaseProfile();
    initNav();
    renderCredits();

    editProfileMsg.textContent = "Profile updated successfully!";
    editProfileMsg.className = "text-green-600 text-sm";

    setTimeout(closeEditModal, 350);
  } catch (error) {
    editProfileMsg.textContent = `${error?.message || "Failed to update profile."}`;
    editProfileMsg.className = "text-red-600 text-sm";
  }
});

renderCredits();

btn?.addEventListener("click", async () => {
  msg.textContent = "";
  msg.className = "text-sm";

  try {
    await refreshProfile();
    renderCredits();
    initNav();
    msg.textContent = `Credits updated!`;
    msg.className = "text-green-600";
  } catch (error) {
    msg.textContent = `${error?.message || "Failed to update credits."}`;
    msg.className = "text-red-600";
  }
});

tabBtns.forEach((b) => {
  b.addEventListener("click", () => handleTabClick(b.dataset.tab));
});

await refreshProfile();
renderCredits();
initNav();
await loadBaseProfile();

setActiveTab("listings");
await loadListingsOnce();
