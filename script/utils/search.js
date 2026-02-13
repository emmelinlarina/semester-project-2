const searchToggle = document.getElementById("searchToggle");
const searchOverlay = document.getElementById("searchOverlay");
const searchInput = document.getElementById("searchInput");
const searchForm = document.getElementById("searchForm");

//toggle search
export function initSearch({ onInput, onSubmit }) {
  function open() {
    searchOverlay?.classList.remove("hidden");
    document.body.classList.add("overflow-hidden");
    searchInput?.focus();
    onInput?.(searchInput?.value ?? "");
  }

  function close() {
    searchOverlay?.classList.add("hidden");
    document.body.classList.remove("overflow-hidden");
  }

  searchToggle?.addEventListener("click", open);

  searchInput?.addEventListener("input", (e) => {
    onInput?.(e.target.value ?? "");
  });

  searchForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = (searchInput?.value || "").trim();
    onSubmit?.(q);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  searchOverlay?.addEventListener("click", (e) => {
    if (e.target === searchOverlay) close();
  });
}
