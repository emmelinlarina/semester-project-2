import { login, ensureAPIKey } from "../api/auth.js";
import { initNav, updateNavUI } from "../utils/nav.js";
import { setToken, setProfile, getToken } from "../utils/storage.js";
import { refreshProfile } from "../api/profiles.js";

initNav({ enableSearch: false });

if (getToken()) {
  window.location.href = "./index.html";
}

function renderLogin() {
  return `
      <a
        href="./index.html"
        aria-label="Go back to home page"
        class="inline-flex items-center gap-2 text-sm text-zinc-700 hover:text-brand-700"
      >
        <i class="fa-solid fa-arrow-left" aria-hidden="true"></i>
      </a>

      <header class="mt-6">
        <h1 class="text-3xl font-bold tracking-tight">Welcome back!</h1>
      </header>

      <section class="mt-8">
        <form id="loginForm" class="grid gap-4" novalidate>
          <div class="grid gap-2">
            <label for="email" class="text-sm font-medium">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              autocomplete="email"
              required
              class="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-brown-500 focus:outline-none focus:ring-1 focus:ring-brown-500"
              placeholder="name@student.noroff.no"
            />
          </div>

          <div class="grid gap-2">
            <label for="password" class="text-sm font-medium">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              autocomplete="current-password"
              required
              class="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-brown-500 focus:outline-none focus:ring-1 focus:ring-brown-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            class="mt-2 inline-flex w-full items-center justify-center rounded-md bg-brand-700 px-4 py-3 text-xl font-semibold font-rasa text-white hover:bg-brand-600 hover:text-brand-700 border-transparent hover:border-brand-700 focus:ring-2 focus:ring-brand-700 focus:ring-offset-2 tracking-wider"
            
          >
            LOGIN
          </button>

          <p class="text-center text-sm text-zinc-700">
            Don't have an account?
            <a
              href="./register.html"
              class="font-medium text-brand-700 hover:text-brand-600"
              
              >Sign up</a
            >
          </p>
          <div
            id="loginMessage"
            class="hidden rounded-xl border border-brand-700/30 bg-brand-700/10 text-brand-700 px-4 py-3 text-sm"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          ></div>
        </form>
      </section>
  `;
}

function mountLogin() {
  const mount = document.getElementById("loginMount");
  if (!mount) throw new Error("No mount element found for login page");
  mount.innerHTML = renderLogin();
}

function setBusy(isBusy) {
  const formEl = document.querySelector("#loginForm");
  const btn = formEl?.querySelector('button[type="submit"]');

  if (btn) {
    btn.disabled = isBusy;
    btn.setAttribute("aria-disabled", String(isBusy));
  }
  if (formEl) {
    formEl.setAttribute("aria-busy", String(isBusy));
  }
}

function markInvalid(id, isInvalid) {
  const element = document.getElementById(id);
  if (!element) return;
  if (isInvalid) element.setAttribute("aria-invalid", "true");
  else element.removeAttribute("aria-invalid");
}

function focusFirstInvalid(ids) {
  for (const id of ids) {
    const element = document.getElementById(id);
    if (element?.getAttribute("aria-invalid") === "true") {
      element.focus();
      return;
    }
  }
}

function showInfo(message, type = "info") {
  if (!box) return;

  box.textContent = message;
  box.classList.remove("hidden");

  if (type === "error") {
    box.setAttribute("tabindex", "-1");
    box.focus();
  }

  box.setAttribute("aria-atomic", "true");
  box.setAttribute("role", type === "error" ? "alert" : "status");
  box.setAttribute("aria-live", type === "error" ? "assertive" : "polite");

  if (type === "error") {
    box.className =
      "rounded-xl border border-red-700/30 bg-red-700/10 px-4 py-3 text-sm text-red-700";
  } else if (type === "success") {
    box.className =
      "rounded-xl border border-green-700/30 bg-green-700/10 px-4 py-3 text-sm text-green-700";
  } else {
    box.className =
      "rounded-xl border border-brand-700/30 bg-brand-700/10 px-4 py-3 text-sm text-brand-700";
  }
}

mountLogin();

const form = document.querySelector("#loginForm");
const box = document.querySelector("#loginMessage");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  box.classList.add("hidden");
  box.textContent = "";

  markInvalid("email", false);
  markInvalid("password", false);

  const data = Object.fromEntries(new FormData(form).entries());
  data.email = (data.email || "").trim().toLowerCase();
  data.password = (data.password || "").trim();

  if (!data.email) {
    markInvalid("email", true);
    showInfo("Please enter your email address.", "error");
    focusFirstInvalid(["email", "password"]);
    return;
  }

  if (!data.password) {
    markInvalid("password", true);
    showInfo("Please enter your password.", "error");
    focusFirstInvalid(["password", "email"]);
    return;
  }

  const btn = form.querySelector('button[type="submit"]');
  const originalText = btn.textContent;

  let redirecting = false;

  try {
    setBusy(true);
    btn.textContent = "LOGGING IN…";

    const response = await login(data);
    const user = response.data;

    setToken(user.accessToken);
    setProfile(user);

    await ensureAPIKey();

    const fresh = await refreshProfile();
    setProfile(fresh || user);

    updateNavUI();

    redirecting = true;
    showInfo("Login successful! Redirecting…", "success");

    setTimeout(() => {
      window.location.href = "./index.html";
    }, 1500);
  } catch (error) {
    showInfo(error.message || "An error occurred during login.", "error");
    setBusy(false);
    btn.textContent = originalText;
  } finally {
    if (!redirecting) {
      setBusy(false);
      btn.textContent = originalText;
    }
  }
});
