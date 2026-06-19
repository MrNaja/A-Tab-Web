const GOOGLE_FAVICON_ENDPOINT = 'https://www.google.com/s2/favicons';
const FALLBACK_ICON =
  'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22%3E%3Crect width=%2216%22 height=%2216%22 rx=%223%22 fill=%22%23e9ecef%22/%3E%3Cpath d=%22M4 8h8M8 4v8%22 stroke=%22%2300a1d6%22 stroke-width=%221.4%22 stroke-linecap=%22round%22/%3E%3C/svg%3E';

/** @param {import('../types').LinkBookmark} bookmark */
export function getFaviconUrl(bookmark) {
  try {
    const url = new URL(bookmark.url);
    return `${GOOGLE_FAVICON_ENDPOINT}?domain=${encodeURIComponent(url.hostname)}&sz=32`;
  } catch (_error) {
    return FALLBACK_ICON;
  }
}
