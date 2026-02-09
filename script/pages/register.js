import { register } from "../api/auth.js";

const form = document.querySelector("#registerForm");
const errorbox = document.querySelector("#registerError");

function showError(message) {
  errorbox.textContent = message;
  errorbox.classList.remove("hidden");
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorbox.classList.add("hidden");
  errorbox.textContent = "";

  const data = Object.fromEntries(new FormData(form).entries());
  data.name = data.name.trim();
  data.email = data.email.trim().toLowerCase();

  try {
    await register(data);
    window.location.href = "/login.html";
  } catch (error) {
    showError(error.message);
  }
});
