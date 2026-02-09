import { login, ensureAPIKey } from "../api/auth.js";
import { setToken, setProfile } from "../utils/storage.js";

const form = document.querySelector("#loginForm");
const errorbox = document.querySelector("#loginError");

function showError(message) {
  errorbox.textContent = message;
  errorbox.classList.remove("hidden");
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorbox.classList.add("hidden");
  errorbox.textContent = "";

  const data = Object.fromEntries(new FormData(form).entries());
  data.email = data.email.trim().toLowerCase();

  try {
    const response = await login(data);

    const user = response.data;
    setToken(user.accessToken);
    setProfile(user);

    await ensureAPIKey();

    window.location.href = "/index.html";
  } catch (error) {
    showError(error.message);
  }
});
