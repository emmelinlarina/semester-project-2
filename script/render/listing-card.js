export const FALLBACK_IMAGE =
  "data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%27600%27%20height=%27400%27%3E%3Crect%20width=%27100%25%27%20height=%27100%25%27%20fill=%27%23e5e7eb%27/%3E%3Ctext%20x=%2750%25%27%20y=%2750%25%27%20dominant-baseline=%27middle%27%20text-anchor=%27middle%27%20fill=%27%236b7280%27%20font-family=%27Arial%27%20font-size=%2722%27%3ENo%20Image%3C/text%3E%3C/svg%3E";

export function getHighestBid(listing) {
  const bids = listing.bids ?? [];
  return bids.reduce((max, bid) => (bid.amount > max ? bid.amount : max), 0);
}

export function timeLeft(endTime) {
  const end = new Date(endTime);
  const diff = end - Date.now();
  if (diff <= 0) return "Ended";

  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${mins % 60}m`;
  return `${mins}m`;
}

export function cardTemplate(
  listing,
  { hrefBase = "./single-listing.html" } = {},
) {
  const title = listing?.title ?? "Untitled";
  const description = listing?.description ?? "";
  const bid = getHighestBid(listing);
  const time = timeLeft(listing?.endsAt);
  const image =
    listing?.media?.length > 0 && listing.media[0].url
      ? listing.media[0].url
      : FALLBACK_IMAGE;

  const sellerName = listing?.seller?.name ?? "Unknown";

  const isFallback = image === FALLBACK_IMAGE;
  const imgAlt = isFallback ? "" : `Image of ${title}`;

  const timeSr =
    time === "Ended"
      ? "Auction ended"
      : `Time left: ${time.replace("d", "days").replace("h", "hours").replace("m", "minutes")}`;

  const href = `${hrefBase}?id=${listing.id}`;

  const titleId = `listing-title-${listing.id}`;
  const descriptionId = `listing-description-${listing.id}`;
  const mediaId = `listing-media-${listing.id}`;

  return ` 
    <a href="${href}" 
    class="block rounded-lg transition-shadow duration-300"
    aria-labelledby="${titleId}"
    aria-describedby="${mediaId} ${descriptionId}"
    >
      <img 
      src="${image}" 
      alt="${imgAlt}" 
      class="w-full h-48 object-cover bg-zinc-200" 
      loading="lazy" 
      onerror='this.onerror=null;this.src="${FALLBACK_IMAGE}"'/>

      <div class="p-4">
        <h3 class="text-lg font-semibold mb-2" id="${titleId}">${title}</h3>

        <span class="text-xs text-gray-500">${time}</span>
        <p class="text-sm text-gray-600 mb-4" id="${descriptionId}">${description}</p>

        <div class="flex items-center justify-between">
          <span class="text-sm font-bold">${bid} $</span>
          
          <span
          id="${mediaId}"
          class="text-xs text-zinc-700 hover:underline underline-offset-2 group-hover:underline"
          >
          @${sellerName}
          </span>
        </div>

      </div>
    </a>
  `;
}

export function renderGrid(el, items, templateFn = cardTemplate) {
  if (!el) return;
  el.innerHTML = items.map(templateFn).join("");
}

export function spinnerMarkup(label = "Loading...") {
  return `
    <div 
    class="flex items-center justify-center gap-3 py-10 text-zinc-600"
    role="status" 
    aria-live="polite" 
    aria-label="${label}"
    >
      <div 
      class="h-5 w-5 rounded-full border-2 border-t-2 border-zinc-400 border-t-zinc-600 animate-spin"
      aria-hidden="true"
      ></div>
      <p class="text-sm">${label}</p>
    </div>
  `;
}

export function skeletonCard(count = 12) {
  return Array.from({ length: count })
    .map(
      () => `
      <div class="block rounded-lg overflow-hidden shadow-md animate-pulse">
        <div class="w-full h-48 bg-zinc-300"></div>

        <div class="p-4">

          <div class="h-5 w-2/3 bg-zinc-100 rounded mb-2"></div>
          <div class="h-4 w-full bg-zinc-100 rounded mb-1"></div>
          <div class="h-4 w-5/6 bg-zinc-100 rounded mb-4"></div>

          <div class="flex items-center justify-between">
            <div class="h-4 w-16 bg-zinc-100 rounded"></div>
            <div class="h-3 w-20 bg-zinc-100 rounded"></div>
          </div>
        </div>
      </div>
    `,
    )
    .join("");
}
