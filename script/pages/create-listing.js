import { requireAuth } from "../utils/guard.js";
import { initNav } from "../utils/nav.js";
import { ensureAPIKey } from "../api/auth.js";
import { createListing } from "../api/listings.js";
import { uploadImage } from "../utils/cloudinary.js";
import {
  initSearch,
  handleSearchInput,
  handleSearchSubmit,
} from "../utils/search.js";

requireAuth();
initNav();

function renderCreateListing() {
  return `
    <section class="rounded-3xl border border-zinc-200 bg-white p-6">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h1 class="text-2xl font-semibold">Create Listing</h1>
            <p class="mt-2 text-zinc-500">
              Fill out the form below to create a new listing.
            </p>
          </div>
          <a
            href="./index.html"
            class="inline-flex items-center gap-2 rounded-full bg-zinc-200 px-5 py-2 text-sm font-semibold hover:bg-zinc-300 transition"
          >
            <i class="fas fa-arrow-left"></i> Back to Home
          </a>
        </div>
        <form id="createListingForm" class="mt-6 grid gap-5">
          <label class="grid gap-2 text-sm">
            <span class="font-semibold">Title</span>
            <input
              type="text"
              id="title"
              name="title"
              maxlength="80"
              class="w-full rounded-lg border border-zinc-200 bg-zinc-100 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-300"
              required
              placeholder="e.g. Vintage clock"
            />
          </label>
          <label class="grid gap-2 text-sm">
            <span class="font-semibold">Description</span>
            <textarea
              id="description"
              name="description"
              class="w-full rounded-lg border border-zinc-200 bg-zinc-100 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-300"
              rows="5"
              placeholder="Tell people what they are bidding on"
              required
            ></textarea>
          </label>

          <div class="grid gap-5 md:grid-cols-2">
            <label class="grid gap-2 text-sm">
              <span class="font-semibold">End Date/time</span>
              <input
                type="datetime-local"
                id="endsAt"
                name="endsAt"
                class="w-full rounded-lg border border-zinc-200 bg-zinc-100 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-300"
                required
              />
            </label>

            <label class="grid gap-2 text-sm">
              <span class="font-semibold">Image Url (optional)</span>
              <input
                type="url"
                id="mediaUrl"
                name="mediaUrl"
                class="w-full rounded-lg border border-zinc-200 bg-zinc-100 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-300"
                placeholder="https://"
              />
            </label>
          </div>

          <label class="grid gap-2 text-sm">
            <span class="font-semibold">Upload images</span>
            <input
              type="file"
              name="media"
              id="media"
              accept="image/*"
              multiple
              class="block cursor-pointer w-full text-sm rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 file:mr-4 file:rounded-full file:border-0 file:bg-zinc-100 file:px-4 file:py-2 file:text-sm file:font-semibold hover:file:bg-zinc-200 transition focus:ring-2 focus:ring-zinc-300"
            />
            <div class="text-xs text-zinc-500 flex flex-wrap gap-2">
              <span>Up to 4 images recommended</span>
            </div>
          </label>
          <div
            id="mediaPreview"
            class="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3"
          ></div>
          <p id="createMsg" class="text-sm"></p>

          <div
            class="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between"
          >
            <button
              id="createSubmit"
              type="submit"
              class="w-full sm:w-auto rounded-full bg-zinc-200 px-5 py-3 text-sm font-semibold hover:bg-zinc-300 transition"
            >
              <i class="fas fa-plus"></i>
              Create Listing
            </button>
          </div>
        </form>
      </section>
  `;
}

function mountCreateListing() {
  const mount = document.getElementById("listingMount");
  if (!mount) throw new Error("Listing mount not found");
  mount.innerHTML = renderCreateListing();
}

mountCreateListing();

const form = document.getElementById("createListingForm");
const msg = document.getElementById("createMsg");
const submitBtn = document.getElementById("createSubmit");

const mediaInput = document.getElementById("media");
const mediaUrlInput = document.getElementById("mediaUrl");
const mediaPreview = document.getElementById("mediaPreview");

function setMsg(text, type = "info") {
  if (!msg) return;
  msg.textContent = text;
  msg.className = "text-sm";

  if (type === "error") msg.classList.add("text-red-500");
  if (type === "success") msg.classList.add("text-green-500");
  if (type === "info") msg.classList.add("text-zinc-500");
}

function toIsoFromDatetimeLocal(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error("Invalid date/time format");
  return date.toISOString();
}

let selectedFiles = [];
let selectedUrl = "";
let objectUrls = [];

function cleanupObjectUrls() {
  objectUrls.forEach((u) => URL.revokeObjectURL(u));
  objectUrls = [];
}

function renderPreviews() {
  if (!mediaPreview) return;

  cleanupObjectUrls();
  mediaPreview.innerHTML = "";

  const header = document.createElement("div");
  header.className = "col-span-full flex items-center justify-between";

  const count = document.createElement("p");
  count.className = "text-sm text-zinc-600";
  count.textContent = `Selected: ${Math.min(selectedFiles.length, 4)}/4`;

  const clearBtn = document.createElement("button");
  clearBtn.type = "button";
  clearBtn.className = "text-sm text-red-500 hover:underline";
  clearBtn.textContent = "Clear all";
  clearBtn.addEventListener("click", () => {
    selectedFiles = [];
    selectedUrl = "";
    if (mediaInput) mediaInput.value = "";
    if (mediaUrlInput) mediaUrlInput.value = "";
    renderPreviews();
  });

  header.appendChild(count);
  header.appendChild(clearBtn);
  mediaPreview.appendChild(header);

  const filesToShow = selectedFiles.slice(0, 4);

  filesToShow.forEach((file, i) => {
    const url = URL.createObjectURL(file);
    objectUrls.push(url);

    const card = document.createElement("div");
    card.className =
      "relative rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-50";

    card.innerHTML = `
            <img 
                src="${url}"
                alt="Selected image ${i + 1}"
                class="w-full h-24 object-cover bg-zinc-200"
                loading="lazy"
            />
            <button
                type="button"
                class="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-75 hover:opacity-100 transition-opacity"
                aria-label="Remove image"
                data-remove-file="${i}"
            >
            <i class="fas fa-xmark"></i>
            </button>
        `;
    mediaPreview.appendChild(card);
  });

  if (selectedFiles.length === 0 && selectedUrl) {
    const card = document.createElement("div");
    card.className =
      "relative rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-50";

    card.innerHTML = `
            <img 
                src="${selectedUrl}"
                alt="Media URL preview"
                class="w-full h-24 object-cover bg-zinc-200"
                loading="lazy"
            />
            <button
                type="button"
                class="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-75 hover:opacity-100 transition-opacity"
                aria-label="Remove media URL"
                data-remove-url="true"
            >
            <i class="fas fa-xmark text-zinc-800"></i>
            </button>
        `;
    mediaPreview.appendChild(card);
  }
}

mediaPreview?.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;

  if (btn.dataset.removeFile !== undefined) {
    const i = Number(btn.dataset.removeFile);
    if (!Number.isNaN(i)) {
      selectedFiles.splice(i, 1);
      if (mediaInput) mediaInput.value = "";
      renderPreviews();
    }
    return;
  }

  if (btn.dataset.removeUrl === "true") {
    selectedUrl = "";
    if (mediaUrlInput) mediaUrlInput.value = "";
    renderPreviews();
  }
});

function fileKey(f) {
  return `${f.name}-${f.size}-${f.lastModified}`;
}

function mergeUniqueFiles(existing, incoming, limit = 4) {
  const map = new Map(existing.map((f) => [fileKey(f), f]));
  incoming.forEach((f) => map.set(fileKey(f), f));
  return Array.from(map.values()).slice(0, limit);
}

mediaInput?.addEventListener("change", (e) => {
  const picked = Array.from(mediaInput.files || []);

  selectedFiles = mergeUniqueFiles(selectedFiles, picked, 4);
  selectedUrl = "";

  if (mediaUrlInput) mediaUrlInput.value = "";
  mediaInput.value = "";

  renderPreviews();
});

mediaUrlInput?.addEventListener("input", (e) => {
  if (selectedFiles.length > 0) return;

  selectedUrl = mediaUrlInput.value.trim();
  renderPreviews();
});

window.addEventListener("beforeunload", cleanupObjectUrls);

form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  setMsg("", "info");

  const title = document.getElementById("title")?.value?.trim() ?? "";
  const description =
    document.getElementById("description")?.value?.trim() ?? "";
  const endsAt = document.getElementById("endsAt")?.value?.trim() ?? "";

  if (!title) return setMsg("Title is required", "error");
  if (!description) return setMsg("Description is required", "error");
  if (!endsAt) return setMsg("End date/time is required", "error");

  const endLocal = new Date(endsAt);
  if (Number.isNaN(endLocal.getTime()))
    return setMsg("Invalid end date/time", "error");
  if (endLocal <= new Date())
    return setMsg("End date/time must be in the future", "error");

  if (submitBtn) submitBtn.disabled = true;

  try {
    await ensureAPIKey();

    const mediaFiles = selectedFiles;
    const mediaUrl = selectedUrl;

    let urls = [];

    if (mediaFiles && mediaFiles.length > 0) {
      const files = Array.from(mediaFiles).slice(0, 4);
      setMsg(`Uploading ${files.length} image(s)...`, "info");
      urls = await Promise.all(files.map(uploadImage));
    } else if (mediaUrl) {
      urls = [mediaUrl];
    }

    setMsg("Creating listing...", "info");

    const payload = {
      title,
      description,
      endsAt: toIsoFromDatetimeLocal(endsAt),
      ...(urls.length ? { media: urls.map((url) => ({ url })) } : {}),
    };

    const result = await createListing(payload);
    const created = result?.data ?? result;
    const id = created?.id;

    setMsg("Listing created successfully!", "success");

    if (id) {
      window.location.href = `./single-listing.html?id=${encodeURIComponent(id)}`;
      return;
    }

    setMsg("Listing created but no ID returned", "error");
  } catch (err) {
    console.error("Error creating listing:", err);
    const message =
      err?.response?.data?.error?.message || err.message || "An error occurred";
    setMsg(`Error: ${message}`, "error");
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
});
initSearch({ onInput: handleSearchInput, onSubmit: handleSearchSubmit });
