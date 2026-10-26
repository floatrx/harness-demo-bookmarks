import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { BookmarkError, addBookmark, normalizeUrl, removeBookmark, sortBookmarks, updateBookmark } from './bookmarks.ts';
import type { Bookmark } from './bookmarks.ts';
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

describe('updateBookmark', () => {
  const list = (): Bookmark[] => [
    { id: 'u-1', title: 'One', url: 'https://example.com/', addedAt: '2026-01-01T00:00:00.000Z' },
    { id: 'u-2', title: 'Two', url: 'https://two.test/', addedAt: '2026-02-01T00:00:00.000Z' },
    { id: 'u-3', title: 'Three', url: 'https://three.test/', addedAt: '2026-03-01T00:00:00.000Z' },
  ];

  test('updateBookmark normalizes the URL, keeps id and addedAt, leaves others untouched', () => {
    const before = list();
    const next = updateBookmark(before, 'u-2', { title: 'Renamed', url: 'new.example.org' });
    assert.equal(next.length, 3);
    assert.deepEqual(next[1], { id: 'u-2', title: 'Renamed', url: 'https://new.example.org/', addedAt: '2026-02-01T00:00:00.000Z' });
    assert.deepEqual(next[0], before[0]);
    assert.deepEqual(next[2], before[2]);
  });

  test('updateBookmark falls back to the hostname for a blank title', () => {
    const next = updateBookmark(list(), 'u-2', { title: '   ', url: 'host.example.org/path' });
    assert.equal(next[1]?.title, 'host.example.org');
  });

  test('updateBookmark does not mutate the input list or its objects', () => {
    const before = list();
    const snapshot = structuredClone(before);
    const refs = [...before];
    updateBookmark(before, 'u-2', { title: 'X', url: 'x.example.org' });
    assert.deepEqual(before, snapshot);
    before.forEach((item, i) => assert.equal(item, refs[i]));
  });

  test('updateBookmark throws BookmarkError for an invalid URL', () => {
    assert.throws(() => updateBookmark(list(), 'u-2', { title: 'T', url: 'ftp://x.test' }), BookmarkError);
    assert.throws(() => updateBookmark(list(), 'u-2', { title: 'T', url: '' }), BookmarkError);
  });

  test('updateBookmark throws BookmarkError for an unknown id', () => {
    assert.throws(() => updateBookmark(list(), 'nope', { title: 'T', url: 'x.test' }), BookmarkError);
  });

  test('updateBookmark throws on a duplicate URL of another bookmark', () => {
    assert.throws(() => updateBookmark(list(), 'u-2', { title: 'Two', url: 'example.com' }), BookmarkError);
    assert.throws(() => updateBookmark(list(), 'u-3', { title: 'Three', url: 'https://example.com/' }), BookmarkError);
  });

  test('updateBookmark does not throw when the URL is unchanged or only the title changes', () => {
    const same = updateBookmark(list(), 'u-1', { title: 'One', url: 'example.com' });
    assert.equal(same[0]?.url, 'https://example.com/');
    const titled = updateBookmark(list(), 'u-1', { title: 'Only title', url: 'https://example.com/' });
    assert.equal(titled[0]?.title, 'Only title');
  });

  test('updateBookmark keeps the edited bookmark in its place under sortBookmarks', () => {
    const before = sortBookmarks(list()).map((b) => b.id);
    const after = sortBookmarks(updateBookmark(list(), 'u-2', { title: 'Z', url: 'z.example.org' })).map((b) => b.id);
    assert.deepEqual(after, before);
  });
});
