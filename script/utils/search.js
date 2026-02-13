const searchToggle = document.getElementById("searchToggle");
const searchInput = document.getElementById("searchInput");
const searchForm = document.getElementById("searchForm");

//toggle search
export function initSearch(onSearch) {
  function open() {
    searchForm.classList.remove("hidden");
    searchInput.setAttribute("aria-expanded", "true");
    searchInput.focus();
  }

  function close() {
    searchForm.classList.add("hidden");
    searchToggle.setAttribute("aria-expanded", "false");
  }

  searchToggle?.addEventListener("click", () => {
    const isHidden = searchForm.classList.contains("hidden");
    if (isHidden) open();
    else close();
  });

  searchClose?.addEventListener("click", close);

  // submit search
  searchForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const query = searchInput.value.trim();
    onSearch(query);
    close();
  });

  // ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  document.addEventListener("click", (e) => {
    if (!searchForm.contains(e.target) && e.target !== searchToggle) {
      const target = e.target;
      const clickedInside =
        searchForm.contains(target) || searchToggle.contains(target);
      if (!clickedInside) close();
    }
  });
}
