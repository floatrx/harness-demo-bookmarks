'use client';

import { type FormEvent, useEffect, useState } from 'react';
import { type Bookmark, BookmarkError, addBookmark, removeBookmark, sortBookmarks, updateBookmark } from '@/lib/bookmarks';
import { SEED } from '@/lib/seed';

const STORAGE_KEY = 'bookmarks:v1';

export function BookmarkList() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(SEED);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [loaded, setLoaded] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) setBookmarks(JSON.parse(saved) as Bookmark[]);
    setLoaded(true);
  }, []);

  const save = (next: Bookmark[]) => {
    setBookmarks(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      save(addBookmark(bookmarks, { title, url }));
      setTitle('');
      setUrl('');
      setError(null);
    } catch (caught) {
      setError(caught instanceof BookmarkError ? caught.message : 'could not add the bookmark');
    }
  };

  const startEdit = (bookmark: Bookmark) => {
    setEditingId(bookmark.id);
    setEditTitle(bookmark.title);
    setEditUrl(bookmark.url);
    setEditError(null);
  };

  const onEditSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingId) return;
    try {
      save(updateBookmark(bookmarks, editingId, { title: editTitle, url: editUrl }));
      setEditingId(null);
      setEditError(null);
    } catch (caught) {
      setEditError(caught instanceof BookmarkError ? caught.message : 'could not save the bookmark');
    }
  };

  return (
    <section className="bookmarks">
      <header className="page-header">
        <h1>Bookmarks</h1>
        <p>Save a link, find it later.</p>
      </header>
      <form className="add-form" onSubmit={onSubmit} data-testid="add-form">
        <input aria-label="URL" placeholder="https://…" value={url} onChange={(event) => setUrl(event.target.value)} required />
        <input aria-label="Title" placeholder="Title (optional)" value={title} onChange={(event) => setTitle(event.target.value)} />
        <button type="submit">Add</button>
      </form>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <p className="count">{bookmarks.length === 1 ? '1 bookmark' : `${bookmarks.length} bookmarks`}</p>
      {loaded && bookmarks.length === 0 && <p className="empty">No bookmarks yet. Add your first link above.</p>}
      <ul className="list" data-testid="bookmark-list">
        {sortBookmarks(bookmarks).map((bookmark) => (
          <li key={bookmark.id} className="item" data-testid="bookmark-item">
            {editingId === bookmark.id ? (
              <form className="edit-form" onSubmit={onEditSubmit}>
                <input aria-label="Title" value={editTitle} onChange={(event) => setEditTitle(event.target.value)} />
                <input aria-label="URL" value={editUrl} onChange={(event) => setEditUrl(event.target.value)} required />
                <button type="submit">Save</button>
                <button type="button" onClick={() => setEditingId(null)}>
                  Cancel
                </button>
                {editError && (
                  <p className="error" role="alert">
                    {editError}
                  </p>
                )}
              </form>
            ) : (
              <>
                <a href={bookmark.url} target="_blank" rel="noreferrer">
                  <span className="item-title">{bookmark.title}</span>
                  <span className="item-url">{new URL(bookmark.url).hostname}</span>
                </a>
                <button type="button" aria-label={`Edit ${bookmark.title}`} onClick={() => startEdit(bookmark)}>
                  ✎
                </button>
                <button type="button" aria-label={`Remove ${bookmark.title}`} onClick={() => save(removeBookmark(bookmarks, bookmark.id))}>
                  ×
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
