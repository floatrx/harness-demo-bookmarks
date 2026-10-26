import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BookmarkError, addBookmark, normalizeUrl, removeBookmark, restoreBookmark, sortBookmarks } from './bookmarks.ts';
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

test('restoreBookmark returns a new list with the bookmark unchanged and does not mutate the input', () => {
  const removed = SEED[1]!;
  const list = removeBookmark(SEED, removed.id);
  const before = structuredClone(list);
  const next = restoreBookmark(list, removed);
  assert.deepEqual(list, before);
  assert.notEqual(next, list);
  assert.deepEqual(
    next.find((bookmark) => bookmark.id === removed.id),
    removed,
  );
});

test('remove then restore equals the original after sorting, for first, middle and last', () => {
  for (const id of ['b-1', 'b-2', 'b-3']) {
    const removed = SEED.find((bookmark) => bookmark.id === id)!;
    assert.deepEqual(restoreBookmark(removeBookmark(SEED, id), removed), sortBookmarks(SEED));
  }
});

test('restoreBookmark refuses a duplicate URL but not a different URL with the same title', () => {
  const removed = { id: 'x-1', title: 'Example', url: 'example.com', addedAt: '2026-10-04T09:00:00.000Z' };
  const list = [...SEED, { id: 'x-2', title: 'Other', url: 'https://example.com/', addedAt: '2026-10-05T09:00:00.000Z' }];
  const before = structuredClone(list);
  assert.throws(() => restoreBookmark(list, removed), BookmarkError);
  assert.deepEqual(list, before);
  assert.equal(restoreBookmark(SEED, removed).length, 4);
  assert.equal(restoreBookmark(SEED, { ...removed, title: 'Next.js', url: 'https://example.org/' }).length, 4);
});

test('restoreBookmark treats a stored URL that cannot be normalized as not equal', () => {
  const removed = { id: 'x-1', title: 'Example', url: 'https://example.com/', addedAt: '2026-10-04T09:00:00.000Z' };
  const list = [...SEED, { id: 'bad', title: 'Bad', url: 'ftp://nope', addedAt: '2026-10-05T09:00:00.000Z' }];
  assert.equal(restoreBookmark(list, removed).length, 5);
});
