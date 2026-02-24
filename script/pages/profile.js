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
import {
  getListingsById,
  updateListing,
  deleteListing,
} from "../api/listings.js";
import {
  initSearch,
  handleSearchInput,
  handleSearchSubmit,
} from "../utils/search.js";

requireAuth();
const params = new URLSearchParams(window.location.search);
const viewedName = params.get("name");

const cache = { listings: null, bids: null };
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

const myBidsGrid = document.getElementById("myBidsGrid");
const listingsHeader = document.getElementById("listingsHeader");
const listingsSubheading = document.getElementById("listingsSubheading");

const editProfileBtn = document.getElementById("editProfileBtn");
const editProfileModal = document.getElementById("editProfile");
const editProfileClose = document.getElementById("editProfileClose");
const editCancel = document.getElementById("editCancel");
const editProfileForm = document.getElementById("editProfileForm");
const editBio = document.getElementById("editBio");
const editAvatar = document.getElementById("editAvatar");
const editBanner = document.getElementById("editBanner");
const editProfileMsg = document.getElementById("editProfileMsg");

const editListingModal = document.getElementById("editListingModal");
const editListingClose = document.getElementById("editListingClose");
const editListingCancel = document.getElementById("editListingCancel");
const editListingForm = document.getElementById("editListingForm");

const editListingTitle = document.getElementById("editListingTitle");
const editListingDescription = document.getElementById(
  "editListingDescription",
);

const editListingEndsAt = document.getElementById("editListingEndsAt");
const editListingMedia = document.getElementById("editListingMedia");
const editListingPreview = document.getElementById("editListingPreview");
const editListingMsg = document.getElementById("editListingMsg");

const activeListingsHeader = document.getElementById("activeListingsHeader");
const activeListingsGrid = document.getElementById("activeListingsGrid");
const expiredListingsHeader = document.getElementById("expiredListingsHeader");
const expiredListingsGrid = document.getElementById("expiredListingsGrid");

let editListingId = null;
let editObjectUrls = [];

function setEditListingMsg(text, type = "info") {
  if (!editListingMsg) return;
  editListingMsg.textContent = text;
  editListingMsg.className = "text-sm";
  if (type === "error") editListingMsg.classList.add("text-red-500");
  if (type === "success") editListingMsg.classList.add("text-green-500");
  if (type === "info") editListingMsg.classList.add("text-zinc-500");
}

function openEditListingModal() {
  if (!editListingId) return;
  setEditListingMsg("", "info");
  editListingModal.classList.remove("hidden");
  editListingModal.classList.add("flex");
  editListingModal.setAttribute("aria-hidden", "false");

  editListingTitle?.focus();
}

function closeEditListingModal() {
  if (!editListingModal) return;

  if (editListingModal.contains(document.activeElement)) {
    document.activeElement.blur();
  }

  editListingModal.classList.add("hidden");
  editListingModal.classList.remove("flex");
  editListingModal.setAttribute("aria-hidden", "true");

  editListingId = null;

  editObjectUrls.forEach((u) => URL.revokeObjectURL(u));
  editObjectUrls = [];

  if (editListingPreview) editListingPreview.innerHTML = "";
  if (editListingMedia) editListingMedia.value = "";
}

function toDatetimeLocal(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (num) => String(num).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function renderEditListingPreview(files = []) {
  if (!editListingPreview) return;

  editObjectUrls.forEach((u) => URL.revokeObjectURL(u));
  editObjectUrls = [];
  editListingPreview.innerHTML = "";

  const list = Array.from(files).slice(0, 4);

  list.forEach((file, i) => {
    const url = URL.createObjectURL(file);
    editObjectUrls.push(url);

    const card = document.createElement("div");
    card.className =
      "relative rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-50";

    card.innerHTML = `
            <img 
              src="${url}" 
              alt="Selected image ${i + 1}"
              class="w-full h-32 object-cover"
            />
            <button 
              type="button"
              class="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-75 hover:opacity-100 transition-opacity"
              aria-label="Remove image"
              data-remove-edit-file="${i}"
            >
              <i class="fas fa-xmark"></i>
            </button>
        `;
    editListingPreview.appendChild(card);
  });
}

editListingPreview?.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-remove-edit-file]");
  if (!btn) return;

  editListingMedia.value = "";
  renderEditListingPreview([]);
  setEditListingMsg("Image selection cleared.", "info");
});

editListingMedia?.addEventListener("change", (e) => {
  renderEditListingPreview(editListingMedia.files || []);
});

editListingClose?.addEventListener("click", closeEditListingModal);
editListingCancel?.addEventListener("click", closeEditListingModal);

document.addEventListener("keydown", (e) => {
  if (
    e.key === "Escape" &&
    editListingModal &&
    !editListingModal.classList.contains("hidden")
  ) {
    closeEditListingModal();
  }
});

async function onListingsGridClick(e) {
  const editBtn = e.target.closest(".editListingsBtn");
  const delBtn = e.target.closest(".deleteListingsBtn");
  if (!editBtn && !delBtn) return;

  const id = (editBtn || delBtn).dataset.id;
  if (!id) return;

  if (delBtn) {
    const ok = confirm("Are you sure you want to delete this listing?");
    if (!ok) return;

    try {
      await deleteListing(id);
      cache.listings = null;
      await loadListingsOnce(true);
    } catch (error) {
      alert(error?.message || "Failed to delete listing.");
    }
    return;
  }

  try {
    const res = await getListingsById(id);
    const listings = unwrapListing(res);

    editListingId = id;
    editListingTitle.value = listings?.title ?? "";
    editListingDescription.value = listings?.description ?? "";
    editListingEndsAt.value = toDatetimeLocal(listings?.endsAt);

    if (editListingMedia) editListingMedia.value = "";
    if (editListingPreview) editListingPreview.innerHTML = "";

    openEditListingModal();
  } catch (error) {
    alert(error?.message || "Failed to load listing details.");
  }
}

activeListingsGrid?.addEventListener("click", onListingsGridClick);
expiredListingsGrid?.addEventListener("click", onListingsGridClick);

editListingForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!editListingId)
    return setEditListingMsg(
      "Listing ID is missing. Please try again.",
      "error",
    );

  const title = editListingTitle.value.trim();
  const description = editListingDescription.value.trim();
  const endsAt = editListingEndsAt.value;

  if (!title) return setEditListingMsg("Title is required.", "error");
  if (!description)
    return setEditListingMsg("Description is required.", "error");
  if (!endsAt) return setEditListingMsg("End date/time is required.", "error");

  const endLocal = new Date(endsAt);
  if (Number.isNaN(endLocal.getTime()))
    return setEditListingMsg("Invalid end date/time.", "error");
  if (endLocal <= new Date())
    return setEditListingMsg("End date/time must be in the future.", "error");

  try {
    const files = Array.from(editListingMedia.files || []).slice(0, 4);

    let media;
    if (files.length) {
      setEditListingMsg(`Uploading ${files.length} image(s)...`, "info");
      const urls = await Promise.all(files.map(uploadImage));
      media = urls.map((url) => ({ url }));
    }

    setEditListingMsg("Updating listing...", "info");

    await updateListing(editListingId, {
      title,
      description,
      endsAt: endLocal.toISOString(),
      media,
    });

    setEditListingMsg("Listing updated successfully!", "success");
    cache.listings = null;
    await loadListingsOnce(true);
    setTimeout(closeEditListingModal, 500);
  } catch (error) {
    setEditListingMsg(error?.message || "Failed to update listing.", "error");
  }
});

function getCurrentName() {
  const me = getProfile()?.name;
  const name = viewedName || me;
  if (!name) throw new Error("User profile not found");
  return name;
}

function isViewingOwnProfile() {
  const me = getProfile()?.name;
  return Boolean(me && getCurrentName() === me);
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
  gridEl.innerHTML = skeletonCard(count);
}

function emptyState(title, text) {
  return `
    <div class="col-span-full rounded-3xl bg-zinc-50 p-6 text-center">
      <h2 class="text-xl font-semibold">${title}</h2>
      <p class="mt-2 text-gray-600">${text}</p>
    </div>
  `;
}

function listingCard(listing, { showActions = true } = {}) {
  const id = listing?.id;
  const title = listing?.title ?? "Untitled";
  const endsAt = listing?.endsAt
    ? new Date(listing.endsAt).toLocaleString()
    : "N/A";

  const media = Array.isArray(listing?.media) ? listing.media : [];
  const img = media?.[0]?.url || "";

  const highest =
    Array.isArray(listing?.bids) && listing.bids.length
      ? Math.max(...listing.bids.map((b) => Number(b.amount) || 0))
      : 0;

  const seller = listing?.seller?.name ?? "Unknown";

  return `
  <article class="rounded-lg overflow-hidden shadow-md bg-white border border-zinc-200">
    <a 
    href="./single-listing.html?id=${encodeURIComponent(id)}" 
    class="block hover:shadow-lg transition-shadow duration-300"
    >
      <div class="h-48 bg-zinc-100">
        <img 
        src="${img}" 
        alt="${title}" 
        class="w-full h-full object-cover" 
        loading="lazy" 
        />
      </div>

      <div class="p-4">
      <p class="line-clamp-1 text-sm font-semibold">${title}</p>

        <div class="mt-2 flex items-center justify-between gap-3">
          <p class="text-sm text-gray-600">Current bid: ${highest} $</p>
          <p class="text-xs text-gray-500">Ends at: ${endsAt}</p>
        </div>
      </div>
    </a>

    <div class="px-4 pb-4 flex items-center justify-between gap-3">
        <a
         href="./user-profile.html?name=${encodeURIComponent(seller)}" 
         class="text-xs text-gray-700 hover:underline underline-offset-2 focus-visible:underline"
         aria-label="View profile of ${seller}"
         >
          @${seller}
        </a>
  
      ${
        showActions
          ? `<div class="flex gap-2">
            <button 
              type="button"
              class="editListingsBtn inline-flex items-center gap-2 rounded-full bg-zinc-200 px-4 py-2 text-xs font-semibold hover:bg-zinc-300 transition"
              data-id="${id}"
            >
              <i class="fas fa-pen"></i> Edit
            </button>
            <button
              type="button"
              class="deleteListingsBtn inline-flex items-center gap-2 rounded-full bg-red-500 text-white px-4 py-2 text-xs font-semibold hover:bg-red-600 transition"
              data-id="${id}"
            >
              <i class="fas fa-trash"></i> Delete
            </button>
          </div>`
          : ""
      }
      </div>
      </article>
      `;
}

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

  const own = isViewingOwnProfile();
  const displayName = profile?.name ?? "User";

  if (listingsHeader)
    listingsHeader.textContent = own ? "Listings" : `${displayName}'s Listings`;
  if (listingsSubheading)
    listingsSubheading.textContent = own
      ? "Listings you created"
      : `Listings created by ${displayName}`;

  const tabListingsBtn = document.querySelector('.tabBtn[data-tab="listings"]');
  if (tabListingsBtn)
    tabListingsBtn.textContent = own ? "Listings" : `${displayName}'s Listings`;
  const bidsTabBtn = document.querySelector('.tabBtn[data-tab="bids"]');

  bidsTabBtn?.classList.toggle("hidden", !own);
  tabBids?.classList.toggle("hidden", !own);

  if (!own) {
    setActiveTab("listings");
  }

  editProfileBtn?.classList.toggle("hidden", !own);
  btn?.classList.toggle("hidden", !own);
  creditsValue?.parentElement?.classList.toggle("hidden", !own);

  setImgFallback(avatarEl, profile?.avatar?.url, "Profile avatar");
  setImgFallback(bannerEl, profile?.banner?.url, "Profile banner");
}

async function loadListingsOnce(force = false) {
  if (cache.listings && !force) return cache.listings;

  cache.listings = (async () => {
    if (expiredListingsGrid) expiredListingsGrid.innerHTML = "";
    if (activeListingsHeader) activeListingsHeader.innerHTML = "";
    if (expiredListingsHeader) expiredListingsHeader.innerHTML = "";
    if (activeListingsGrid) showSkeletons(activeListingsGrid, 6);

    const name = getCurrentName();
    const res = await getProfileListings(name, { limit: 50, page: 1 });
    const listings = res?.data ?? res ?? [];

    if (!Array.isArray(listings) || listings.length === 0) {
      if (activeListingsGrid) {
        activeListingsGrid.innerHTML = emptyState(
          "No listings yet",
          "You haven't created any listings. Start selling your items now!",
        );
      }
      return [];
    }
    if (expiredListingsGrid) expiredListingsGrid.innerHTML = "";
    if (activeListingsHeader) activeListingsHeader.innerHTML = "";
    if (expiredListingsHeader) expiredListingsHeader.innerHTML = "";

    const now = Date.now();
    const active = [];
    const expired = [];

    for (const listing of listings) {
      const ends = new Date(listing?.endsAt ?? 0).getTime();
      const isExpired = !Number.isFinite(ends) || ends <= now;
      (isExpired ? expired : active).push(listing);
    }

    active.sort(
      (a, b) => new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime(),
    );
    expired.sort(
      (a, b) => new Date(b.endsAt).getTime() - new Date(a.endsAt).getTime(),
    );

    const showActions = isViewingOwnProfile();

    const section = (label, count) => `
    <div class="col-span-full">
      <div class="flex items-center justify-between mb-2">
        <p class="text-sm font-semibold text-gray-700">${label}</p>
        <span class="text-sm text-gray-500">${count} ${count === 1 ? "listing" : "listings"}</span>
      </div>
    </div>
  `;

    if (activeListingsHeader) {
      activeListingsHeader.innerHTML = section(
        "Active Listings",
        active.length,
      );
    }

    if (activeListingsGrid) {
      activeListingsGrid.innerHTML = active.length
        ? active.map((l) => listingCard(l, { showActions })).join("")
        : emptyState(
            "No active listings",
            "You haven't created any active listings. Start selling your items now!",
          );
    }

    if (expiredListingsHeader) {
      expiredListingsHeader.innerHTML = section(
        "Expired Listings",
        expired.length,
      );
    }

    if (expiredListingsGrid) {
      expiredListingsGrid.innerHTML = expired.length
        ? expired.map((l) => listingCard(l, { showActions })).join("")
        : emptyState("No expired listings", "");
    }

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

    const now = Date.now();
    const active = [];
    const expired = [];

    for (const listing of resolved) {
      const ends = new Date(listing?.endsAt ?? 0).getTime();
      const isExpired = !Number.isFinite(ends) || ends <= now;
      (isExpired ? expired : active).push(listing);
    }

    active.sort(
      (a, b) => new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime(),
    );
    expired.sort(
      (a, b) => new Date(b.endsAt).getTime() - new Date(a.endsAt).getTime(),
    );

    const section = (label) => `
      <div class="col-span-full mt-4">
        <p class="text-sm font-semibold text-gray-700 mb-2">${label}</p>
      </div>
    `;

    const htmlParts = [
      ...(active.length
        ? [
            section("Active Bids"),
            ...active.map((l) => listingCard(l, { showActions: false })),
          ]
        : []),
      ...(expired.length
        ? [
            section("Expired Bids"),
            ...expired.map((l) => listingCard(l, { showActions: false })),
          ]
        : []),
    ];
    myBidsGrid.innerHTML = htmlParts.join("");

    myBidsGrid.innerHTML = htmlParts.length
      ? htmlParts.join("")
      : emptyState(
          "No bids yet",
          "You haven't placed any bids. Start exploring listings and place your first bid!",
        );
    return { active, expired };
  })();

  return cache.bids;
}

async function handleTabClick(tab) {
  const own = isViewingOwnProfile();

  if (tab === "bids" && !own) {
    setActiveTab("listings");
    return;
  }

  setActiveTab(tab);

  try {
    if (tab === "listings") await loadListingsOnce();
    if (tab === "bids") await loadBidsOnce();
  } catch (error) {
    const box = tab === "listings" ? activeListingsGrid : myBidsGrid;
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
    if (isViewingOwnProfile()) {
      renderCredits();
    }

    editProfileMsg.textContent = "Profile updated successfully!";
    editProfileMsg.className = "text-green-600 text-sm";

    setTimeout(closeEditModal, 350);
  } catch (error) {
    editProfileMsg.textContent = `${error?.message || "Failed to update profile."}`;
    editProfileMsg.className = "text-red-600 text-sm";
  }
});

if (isViewingOwnProfile()) {
  renderCredits();
}

btn?.addEventListener("click", async () => {
  msg.textContent = "";
  msg.className = "text-sm";

  try {
    await refreshProfile();
    if (isViewingOwnProfile()) {
      renderCredits();
    }
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
if (isViewingOwnProfile()) {
  renderCredits();
}
initNav();
await loadBaseProfile();

setActiveTab("listings");
await loadListingsOnce();

initSearch({ onInput: handleSearchInput, onSubmit: handleSearchSubmit });
