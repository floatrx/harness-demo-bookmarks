import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BookmarkError, addBookmark, formatRelativeTime, normalizeUrl, removeBookmark, sortBookmarks } from './bookmarks.ts';
import { SEED } from './seed.ts';

test('normalizeUrl adds https and rejects other schemes', () => {
  assert.equal(normalizeUrl('example.com'), 'https://example.com/');
  assert.equal(normalizeUrl(' http://example.com/a '), 'http://example.com/a');
  assert.throws(() => normalizeUrl('ftp://example.com'), BookmarkError);
  assert.throws(() => normalizeUrl(''), BookmarkError);
});

test('addBookmark appends without changing the input and defaults the title to the host', () => {
  const now = new Date('2026-10-25T10:00:00.000Z');
  const next = addBookmark(SEED, { title: '  ', url: 'example.com' }, now);
  assert.equal(SEED.length, 3);
  assert.equal(next.length, 4);
  assert.deepEqual(next.at(-1), { id: next.at(-1)?.id, title: 'example.com', url: 'https://example.com/', addedAt: now.toISOString() });
});

test('removeBookmark and sortBookmarks', () => {
  assert.deepEqual(
    removeBookmark(SEED, 'b-2').map((bookmark) => bookmark.id),
    ['b-1', 'b-3'],
  );
  assert.deepEqual(
    sortBookmarks(SEED).map((bookmark) => bookmark.id),
    ['b-3', 'b-2', 'b-1'],
  );
});

test('formatRelativeTime buckets, singular and plural, boundaries', () => {
  const now = new Date('2026-10-26T12:00:00Z');
  const ago = (ms: number) => formatRelativeTime(new Date(now.getTime() - ms).toISOString(), now);
  const sec = 1000;
  const min = 60 * sec;
  const hour = 60 * min;
  const day = 24 * hour;
  assert.equal(ago(0), 'just now');
  assert.equal(ago(59 * sec), 'just now');
  assert.equal(ago(60 * sec), '1 minute ago');
  assert.equal(ago(2 * min), '2 minutes ago');
  assert.equal(ago(59 * min), '59 minutes ago');
  assert.equal(ago(60 * min), '1 hour ago');
  assert.equal(ago(90 * min), '1 hour ago');
  assert.equal(ago(2 * hour), '2 hours ago');
  assert.equal(ago(23 * hour), '23 hours ago');
  assert.equal(ago(24 * hour), '1 day ago');
  assert.equal(ago(3 * day), '3 days ago');
  assert.equal(ago(25 * day), '25 days ago');
});

test('formatRelativeTime treats the future as just now and ignores invalid dates', () => {
  const now = new Date('2026-10-26T12:00:00Z');
  assert.equal(formatRelativeTime('2026-10-26T13:00:00Z', now), 'just now');
  assert.doesNotThrow(() => formatRelativeTime('not-a-date', now));
  assert.equal(formatRelativeTime('not-a-date', now), '');
});
