import { getToken, getProfile, logout } from "./storage.js";
import { initSearch, handleSearchInput, handleSearchSubmit } from "./search.js";

export function renderNav(mountId = "navMount", { enableSearch = true } = {}) {
  const mount = document.getElementById(mountId);
  if (!mount) return;

  mount.innerHTML = `
  <header class="sticky top-0 z-40 border-b border-zinc-200/70 bg-white/80 backdrop-blur supports-backdrop-filter:bg-white/60">
    <nav class="mx-auto max-w-6xl px-6 py-3" aria-label="Primary navigation">
      <div class="rounded  px-3 py-3">

      <div class="flex items-center gap-2 justify-between md:gap-4">
      <div class="flex items-center gap-1 md:gap-2 justify-self-start">

            <a
              href="./index.html"
              class="inline-flex items-center gap-2 rounded-full px-5 py-1 text-sm md:text-lg lg:text-2xl tracking-wide text-brand-700 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
            >
              AUCTION HOUSE
            </a>

            ${
              enableSearch
                ? `
            <button
              id="searchToggle"
              type="button"
              class="inline-flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-brand-600/20 bg-brand-600/50 hover:bg-brand-600/80 transition shadow-sm hover:shadow-md hover:-translate-y-px focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
              aria-label="Search"
              aria-controls="searchOverlay"
              aria-expanded="false"
            >
              <i class="fas fa-search text-brand-700" aria-hidden="true"></i>
            </button>
            `
                : ""
            }
          </div>

          <div class="justify-self-center">
            <!-- Create + (logged in only) -->
            <a
              id="navCreate"
              href="./create-listing.html"
              class="hidden font-rasa items-center justify-center gap-2 hover:-translate-y-px text-2xl text-brand-700 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
              aria-label="Create listing"
            >
              <i class="fa-solid fa-circle-plus text-2xl" aria-hidden="true"></i>
              <span class="hidden sm:inline font-semibold"
              >CREATE
              </span>
            </a>
          </div>

          <!-- DESKTOP: Logged OUT -->
          <div id="navLoggedOut" class="hidden md:flex items-center gap-2">
              <a href="./login.html"
                class="inline-flex h-10 items-center justify-center rounded-full border border-brand-600/40 bg-white px-5 text-sm text-brand-700 hover:bg-zinc-50 hover:-translate-y-px transition"
                aria-label="Log in"
              >
                LOG IN
              </a>
              <a href="./register.html"
                class="inline-flex h-10 items-center justify-center rounded-full border bg-brand-700 px-5 text-sm font-semibold text-white  hover:-translate-y-px transition"
                aria-label="Sign up"
              >
                SIGN UP
              </a>
            
          </div>

          <!-- DESKTOP: Logged IN -->
          <div id="navLoggedIn" class="hidden items-center gap-2 justify-self-end">
            <span
              id="navCredits"
              class="inline-flex h-8 items-center justify-center rounded-2xl  bg-brand-600/20 px-3 text-lg text-brand-700 font-semibold"
            >
              0 $
            </span>

            <a
              href="./user-profile.html"
              class="inline-flex  md:text-sm sm:text-xs items-center justify-center px-4 text-base text-brand-700 hover:-translate-y-px transition"
            >
              PROFILE
            </a>

            <button
              id="logoutBtn"
              type="button"
              class="inline-flex  w-8 items-center justify-center rounded-sm transition hover:-translate-y-px"
              aria-label="Log out"
            >
              <i class="fas fa-right-from-bracket text-brand-700 text-lg" aria-hidden="true"></i>
            </button>
          </div>

          <!-- MOBILE ICON: Profile (only logged in) -->
          <span
            id="mobileCreditsTop"
            class="hidden h-8 items-center justify-center rounded-full bg-brand-600/50 hover:bg-brand-600/80 px-5 text-sm font-semibold"
          >
            0 $
          </span>
          <div class="flex items-center gap-2 md:hidden ml-auto">
            <a
              id="mobileProfileIcon"
              href="./user-profile.html"
              class="hidden h-8 w-8 items-center justify-center rounded-full bg-brand-600/50 hover:bg-brand-600/80 transition"
              aria-label="Profile"
            >
              <i class="fas fa-user text-brand-700" aria-hidden="true"></i>
            </a>

            <!-- MOBILE: Hamburger -->
            <button
              id="navMenu"
              type="button"
              class="inline-flex md:hidden h-8 w-8 items-center justify-center rounded-full bg-brand-600/50 hover:bg-brand-600/80 transition"
              aria-label="Open menu"
              aria-controls="mobileMenu"
              aria-expanded="false"
            >
              <i class="fas fa-bars text-brand-700" aria-hidden="true"></i>
            </button>
          </div>
        </div>

        <!-- search overlay -->
        ${
          enableSearch
            ? `
        <div
          id="searchOverlay"
          class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          aria-hidden="true"
          role="dialog"
          aria-modal="true"
          aria-labelledby="searchTitle"
          >
          <form
            id="searchForm"
            class="w-[90%] max-w-lg rounded-3xl bg-white p-6 shadow-xl"
          >
          <h2 id="searchTitle" class="sr-only">Search Listings</h2>

            <div class="flex items-center gap-3">
            <label for="searchInput" class="sr-only">Search Listings</label>
              <input
                type="search"
                id="searchInput"
                placeholder="Search Listings"
                class="w-full rounded-full border border-zinc-200 bg-zinc-100 px-5 py-3 text-base outline-none focus:ring-2 focus:ring-zinc-300"
              />
              <button
                type="submit"
                class="rounded-full bg-zinc-200 px-5 py-3 text-sm font-semibold hover:bg-zinc-300 transition"
              >
                Search
              </button>
            </div>
            <div
              id="searchResults"
              class="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto pr-2"
            ></div>
          </form>
        </div>
        `
            : ""
        }
        <!-- MOBILE MENU PANEL (UNDER ROW) -->
        <div
          id="mobileMenu"
          class="hidden mt-3 rounded-xl border border-zinc-200 bg-white p-3"
        >
          <!-- Logged OUT -->
          <div id="mobileLoggedOut">
            <a
              href="./login.html"
              class="block rounded-lg px-4 py-3 text-sm font-semibold hover:bg-zinc-100"
              >LOG IN</a
            >
            <a
              href="./register.html"
              class="mt-1 block rounded-lg px-4 py-3 text-sm font-semibold hover:bg-zinc-100"
              >SIGN UP</a
            >
          </div>

          <!-- Logged IN -->
          <div id="mobileLoggedIn" class="hidden">
            <div class="mb-1 rounded-lg bg-zinc-50 px-4 py-3 text-sm">
              Credits: <span id="mobileCredits" class="font-semibold">0</span> $
            </div>

            <a
              href="./user-profile.html"
              class="block rounded-lg px-4 py-3 text-sm font-semibold hover:bg-zinc-100 text-brand-700"
              >PROFILE</a
            >
            <a
              href="./create-listing.html"
              class="mt-1 block rounded-lg px-4 py-3 text-sm font-semibold hover:bg-zinc-100 text-brand-700"
              >CREATE LISTING</a
            >
            <button
              id="mobileLogoutBtn"
              type="button"
              class="mt-1 w-full rounded-lg px-4 py-3 text-left text-sm font-semibold hover:bg-zinc-100 text-brand-700"
            >
              LOG OUT
            </button>
          </div>
        </div>
        </div>
      </nav>
    </header>
  `;
}

export function initMobileMenu({
  menuBtnId = "navMenu",
  mobileMenuId = "mobileMenu",
} = {}) {
  const menuBtn = document.getElementById(menuBtnId);
  const mobileMenu = document.getElementById(mobileMenuId);

  menuBtn?.addEventListener("click", () => {
    const isOpen = !mobileMenu.classList.contains("hidden");
    mobileMenu.classList.toggle("hidden");
    menuBtn.setAttribute("aria-expanded", String(!isOpen));
  });
}

export function initLogout({
  logoutBtnId = "logoutBtn",
  mobileLogoutBtnId = "mobileLogoutBtn",
  redirectTo = "./login.html",
} = {}) {
  const logoutBtn = document.getElementById(logoutBtnId);
  const mobileLogoutBtn = document.getElementById(mobileLogoutBtnId);

  function doLogout() {
    logout();
    window.location.href = redirectTo;
  }

  logoutBtn?.addEventListener("click", doLogout);
  mobileLogoutBtn?.addEventListener("click", doLogout);
}

export function updateNavUI() {
  const token = getToken();
  const profile = getProfile();
  const credits = profile?.credits ?? 0;

  const navCreate = document.getElementById("navCreate");
  const navLoggedIn = document.getElementById("navLoggedIn");
  const navLoggedOut = document.getElementById("navLoggedOut");
  const navCredits = document.getElementById("navCredits");

  const mobileLoggedIn = document.getElementById("mobileLoggedIn");
  const mobileLoggedOut = document.getElementById("mobileLoggedOut");
  const mobileProfileIcon = document.getElementById("mobileProfileIcon");
  const mobileCredits = document.getElementById("mobileCredits");
  const mobileCreditsTop = document.getElementById("mobileCreditsTop");

  // reset
  navLoggedOut?.classList.add("hidden");
  navLoggedOut?.classList.remove("md:flex");

  navLoggedIn?.classList.add("hidden");
  navLoggedIn?.classList.remove("md:flex");

  navCreate?.classList.add("hidden");

  mobileLoggedOut?.classList.add("hidden");
  mobileLoggedIn?.classList.add("hidden");

  // mobile
  mobileProfileIcon?.classList.remove("hidden");

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

export function initNav({ enableSearch = true } = {}) {
  renderNav("navMount", { enableSearch });
  updateNavUI();

  if (enableSearch) {
    const overlay = document.getElementById("searchOverlay");
    if (overlay) document.body.appendChild(overlay);
  }

  if (enableSearch) {
    initSearch({
      onInput: handleSearchInput,
      onSubmit: handleSearchSubmit,
    });
  }
  initMobileMenu();
  initLogout();
}
