// Bookmark logic, kept free of React so `node --test` runs it directly (Node strips the types).

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  addedAt: string;
}

export interface NewBookmark {
  title: string;
  url: string;
}

export class BookmarkError extends Error {
  override name = 'BookmarkError';
}

/** Adds `https://` when the scheme is missing and rejects anything that is not an http(s) URL. */
export function normalizeUrl(input: string): string {
  const raw = input.trim();
  if (!raw) throw new BookmarkError('the URL is empty');
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    throw new BookmarkError(`not a URL: ${raw}`);
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new BookmarkError('only http and https links');
  return url.toString();
}

/** Returns a new list with the bookmark appended. The input list is never changed. */
export function addBookmark(list: readonly Bookmark[], input: NewBookmark, now = new Date()): Bookmark[] {
  const url = normalizeUrl(input.url);
  const title = input.title.trim() || new URL(url).hostname;
  const bookmark: Bookmark = { id: `b-${now.getTime().toString(36)}-${list.length}`, title, url, addedAt: now.toISOString() };
  return [...list, bookmark];
}

export function removeBookmark(list: readonly Bookmark[], id: string): Bookmark[] {
  return list.filter((bookmark) => bookmark.id !== id);
}

/** Relative age such as "just now" or "3 days ago". Returns '' when `addedAt` is not a date. */
export function formatRelativeTime(addedAt: string, now = new Date()): string {
  const then = Date.parse(addedAt);
  if (Number.isNaN(then)) return '';
  const minutes = Math.floor((now.getTime() - then) / 60_000);
  if (minutes < 1) return 'just now';
  const plural = (count: number, unit: string) => `${count} ${unit}${count === 1 ? '' : 's'} ago`;
  if (minutes < 60) return plural(minutes, 'minute');
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return plural(hours, 'hour');
  return plural(Math.floor(hours / 24), 'day');
}

/** Newest first. */
export function sortBookmarks(list: readonly Bookmark[]): Bookmark[] {
  return [...list].sort((a, b) => b.addedAt.localeCompare(a.addedAt));
}
