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
        <i class="fa-solid fa-arrow-left"></i>
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
              autocomplete="current-password"
              required
              class="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-brown-500 focus:outline-none focus:ring-1 focus:ring-brown-500"
              placeholder="••••••••"
            />
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

function showError(message) {
  box.textContent = message;
  box.className =
    "rounded-xl border border-red-700/30 bg-red-700/10 px-4 py-3 text-sm text-red-700";
  box.classList.remove("hidden");
}

function showSuccess(message) {
  box.textContent = message;
  box.className =
    "rounded-xl border border-green-700/30 bg-green-700/10 px-4 py-3 text-sm text-green-700";
  box.classList.remove("hidden");
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

  const btn = form.querySelector('button[type="submit"]');
  const originalText = btn.textContent;

  let redirecting = false;

  try {
    btn.textContent = "REGISTERING…";
    btn.disabled = true;

    await register(data);

    redirecting = true;
    showSuccess("Registration successful! Redirecting to login…");

    setTimeout(() => {
      window.location.href = "./login.html";
    }, 2000);
  } catch (error) {
    showError(error.message || "Registration failed.");
  } finally {
    if (!redirecting) {
      btn.textContent = originalText;
      btn.disabled = false;
    }
  }
});
