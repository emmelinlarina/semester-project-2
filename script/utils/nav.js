import { getToken, getProfile, logout } from "./storage.js";

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

export function initNav() {
  initMobileMenu();
  initLogout();
  updateNavUI();
}
