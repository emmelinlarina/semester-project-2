import { requireAuth } from "../utils/guard.js";
import { refreshProfile } from "../api/profiles.js";
import { getProfile } from "../utils/storage.js";
import { initNav } from "../utils/nav.js";

requireAuth();

const creditsValue = document.getElementById("creditsValue");
const btn = document.getElementById("refreshCredits");
const msg = document.getElementById("creditsMsg");

function renderCredits() {
  const profile = getProfile();
  creditsValue.textContent = String(profile?.credits ?? "0");
}

renderCredits();

btn?.addEventListener("click", async () => {
  msg.textContent = "";

  try {
    const updated = await refreshProfile();
    renderCredits();
    initNav();
    msg.textContent = `Credits updated!`;
    msg.className = "text-green-600";
  } catch (error) {
    msg.textContent = `${error?.message || "Failed to update credits."}`;
    msg.className = "text-red-600";
  }
});

await refreshProfile();
renderCredits();
initNav();
