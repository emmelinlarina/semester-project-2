import { login, ensureAPIKey } from "../api/auth.js";
import { setToken, setProfile } from "../utils/storage.js";
import { refreshProfile } from "../api/profiles.js";

const form = document.querySelector("#loginForm");
const box = document.querySelector("#loginMessage");

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

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  box.classList.add("hidden");
  box.textContent = "";

  const data = Object.fromEntries(new FormData(form).entries());
  data.email = data.email.trim().toLowerCase();

  const btn = form.querySelector('button[type="submit"]');
  const originalText = btn.textContent;

  let redirecting = false;

  try {
    btn.textContent = "LOGGING IN…";
    btn.disabled = true;

    const response = await login(data);
    const user = response.data;

    setToken(user.accessToken);
    setProfile(user);

    await ensureAPIKey();

    const fresh = await refreshProfile();
    setProfile(fresh || user);

    redirecting = true;
    showSuccess("Login successful! Redirecting…");

    setTimeout(() => {
      window.location.href = "./index.html";
    }, 2000);
  } catch (error) {
    showError(error.message || "An error occurred during login.");
  } finally {
    if (!redirecting) {
      btn.textContent = originalText;
      btn.disabled = false;
    }
  }
});
