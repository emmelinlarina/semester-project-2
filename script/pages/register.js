import { register } from "../api/auth.js";

const form = document.querySelector("#registerForm");
const box = document.querySelector("#registerMessage");

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
