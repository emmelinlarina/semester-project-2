const searchToggle = document.getElementById("searchToggle");
const searchOverlay = document.getElementById("searchOverlay");
const searchInput = document.getElementById("searchInput");
const searchForm = document.getElementById("searchForm");

//toggle search
export function initSearch(onSearch) {
  function open() {
    searchOverlay.classList.remove("hidden");
    document.body.classList.add("overflow-hidden");
    searchInput.focus();
  }

  function close() {
    searchOverlay.classList.add("hidden");
    document.body.classList.remove("overflow-hidden");
    searchInput.value = "";
  }

  searchToggle?.addEventListener("click", open);

  // submit search
  searchForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const query = (searchInput.value || "").trim();
    onSearch(query);
    close();
    searchInput.value = "";
  });

  // ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  document.addEventListener("click", (e) => {
    if (e.target === searchOverlay) {
      close();
    }
  });
}
