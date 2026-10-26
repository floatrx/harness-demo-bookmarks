import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BookmarkError, addBookmark, filterBookmarks, normalizeUrl, removeBookmark, sortBookmarks } from './bookmarks.ts';
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

const ids = (list: readonly { id: string }[]) => list.map((bookmark) => bookmark.id);

test('filterBookmarks matches the title', () => {
  assert.deepEqual(ids(filterBookmarks(SEED, 'web docs')), ['b-2']);
  assert.deepEqual(ids(filterBookmarks(SEED, 'docs')), ['b-1', 'b-2', 'b-3']);
});

test('filterBookmarks matches the URL path or query, not only the hostname', () => {
  const list = [
    { id: 'p-1', title: 'Alpha', url: 'https://example.com/guides/intro?topic=zebra', addedAt: '2026-10-01T09:00:00.000Z' },
    { id: 'p-2', title: 'Beta', url: 'https://example.org/other', addedAt: '2026-10-02T09:00:00.000Z' },
  ];
  assert.deepEqual(ids(filterBookmarks(list, 'guides/intro')), ['p-1']);
  assert.deepEqual(ids(filterBookmarks(list, 'topic=zebra')), ['p-1']);
  assert.deepEqual(ids(filterBookmarks(SEED, 'api/')), ['b-1']);
});

test('filterBookmarks is case-insensitive', () => {
  assert.deepEqual(ids(filterBookmarks(SEED, 'NEXT.JS')), ['b-3']);
  assert.deepEqual(ids(filterBookmarks(SEED, 'mdn')), ['b-2']);
  assert.deepEqual(ids(filterBookmarks(SEED, 'NODEJS.ORG')), ['b-1']);
});

test('filterBookmarks trims the query', () => {
  assert.deepEqual(ids(filterBookmarks(SEED, '  mdn  ')), ['b-2']);
  assert.deepEqual(ids(filterBookmarks(SEED, '\tNext.js\n')), ['b-3']);
});

test('filterBookmarks returns every item, as a new array, for an empty or whitespace query', () => {
  for (const query of ['', '   ', '\t\n']) {
    const result = filterBookmarks(SEED, query);
    assert.deepEqual(result, SEED);
    assert.notEqual(result, SEED);
  }
});

test('filterBookmarks returns [] when nothing matches and keeps the original order', () => {
  assert.deepEqual(filterBookmarks(SEED, 'no-such-bookmark'), []);
  assert.deepEqual(ids(filterBookmarks(SEED, 'https')), ['b-1', 'b-2', 'b-3']);
});

test('filterBookmarks does not change the input', () => {
  const before = JSON.stringify(SEED);
  const length = SEED.length;
  filterBookmarks(SEED, 'mdn');
  filterBookmarks(SEED, '');
  filterBookmarks(SEED, 'zzz');
  assert.equal(SEED.length, length);
  assert.equal(JSON.stringify(SEED), before);
});
