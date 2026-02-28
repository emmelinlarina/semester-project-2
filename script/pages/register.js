import { register } from "../api/auth.js";
import { initNav } from "../utils/nav.js";

initNav({ enableSearch: false });

function renderRegister() {
  return `
  <a
        href="./index.html"
        aria-label="Go back to home page"
        class="inline-flex items-center gap-2 text-sm text-zinc-700 hover:text-brand-700"
      >
        <i class="fa-solid fa-arrow-left" aria-hidden="true"></i>
      </a>

      <header class="mt-6">
        <h1 class="text-3xl font-bold tracking-tight">Let's get started!</h1>
      </header>

      <section class="mt-8">
        <form id="registerForm" class="grid gap-4" novalidate>
          <div class="grid gap-2">
            <label for="name" class="text-sm font-medium">Name</label>
            <input
              id="name"
              name="name"
              type="text"
              required
              minlength="3"
              class="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-brown-500 focus:outline-none focus:ring-1 focus:ring-brown-500"
              placeholder="Ola Nordmann"
            />
          </div>

          <div class="grid gap-2">
            <label for="email" class="text-sm font-medium">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              autocomplete="email"
              required
              class="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-brown-500 focus:outline-none focus:ring-1 focus:ring-brown-500"
              placeholder="name@stud.noroff.no"
            />
          </div>

          <div class="grid gap-2">
            <label for="password" class="text-sm font-medium">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              minlength="8"
              autocomplete="new-password"
              required
              aria-describedby="passwordHelp"
              class="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-brown-500 focus:outline-none focus:ring-1 focus:ring-brown-500"
              placeholder="••••••••"
            />
            <p id="passwordHelp" class="text-xs text-zinc-500 mt-1">
              Must be at least 8 characters.
            </p>
          </div>

          <button
            type="submit"
            class="mt-2 inline-flex w-full items-center justify-center rounded-md bg-brand-700 px-4 py-3 text-xl font-semibold font-rasa text-white hover:bg-brand-600 hover:text-brand-700 hover:border-brand-700 focus:ring-2 focus:bg-brand-600 focus:ring-offset-2 tracking-wider"
          >
            REGISTER
          </button>

          <p class="text-center text-sm text-zinc-300">
            Already have an account?
            <a
              href="./login.html"
              class="font-bold text-brand-700 hover:text-brand-600"
              >Log in</a
            >
          </p>

          <div
            id="registerMessage"
            class="hidden rounded-xl border border-brand-700/30 bg-brand-700/10 text-brand-700 px-4 py-3 text-sm"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          ></div>
        </form>
      </section>

  `;
}

function mountRegister() {
  const mount = document.getElementById("registerMount");
  if (!mount) throw new Error("No mount element found for register page");
  mount.innerHTML = renderRegister();
}

function setBusy(isBusy) {
  const formEl = document.querySelector("#registerForm");
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
mountRegister();

const form = document.querySelector("#registerForm");
const box = document.querySelector("#registerMessage");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  box.classList.add("hidden");
  box.textContent = "";

  const data = Object.fromEntries(new FormData(form).entries());
  data.name = data.name.trim();
  data.email = data.email.trim().toLowerCase();

  markInvalid("name", false);
  markInvalid("email", false);
  markInvalid("password", false);

  data.password = (data.password || "").trim();

  if (!data.name || data.name.length < 3) {
    markInvalid("name", true);
    showInfo("Please enter your name (at least 3 characters).", "error");
    focusFirstInvalid(["name", "email", "password"]);
    return;
  }

  if (!data.email) {
    markInvalid("email", true);
    showInfo("Please enter a stud@noroff.no email", "error");
    focusFirstInvalid(["email", "name", "password"]);
    return;
  }

  if (!data.password || data.password.length < 8) {
    markInvalid("password", true);
    showInfo("Password must be at least 8 characters long.", "error");
    focusFirstInvalid(["password", "name", "email"]);
    return;
  }

  const btn = form.querySelector('button[type="submit"]');
  const originalText = btn.textContent;

  let redirecting = false;

  try {
    btn.textContent = "REGISTERING…";
    setBusy(true);

    await register(data);

    redirecting = true;
    showInfo("Registration successful! Redirecting to login…", "success");

    setTimeout(() => {
      window.location.href = "./login.html";
    }, 2000);
  } catch (error) {
    showInfo(error.message || "Registration failed.", "error");
  } finally {
    if (!redirecting) {
      btn.textContent = originalText;
      setBusy(false);
    }
  }
});
