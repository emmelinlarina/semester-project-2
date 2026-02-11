import { getToken, getProfile, logout } from "../utils/storage.js";

const menuBtn = document.getElementById("navMenu");
const mobileMenu = document.getElementById("mobileMenu");

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

// Hamburger toggle
menuBtn?.addEventListener("click", () => {
  const isOpen = !mobileMenu.classList.contains("hidden");
  mobileMenu.classList.toggle("hidden");
  menuBtn.setAttribute("aria-expanded", String(!isOpen));
});

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

updateNav();
