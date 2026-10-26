'use client';

import { type FormEvent, useEffect, useRef, useState } from 'react';
import { type Bookmark, BookmarkError, addBookmark, removeBookmark, restoreBookmark, sortBookmarks } from '@/lib/bookmarks';
import { SEED } from '@/lib/seed';

const STORAGE_KEY = 'bookmarks:v1';
const TOAST_MS = 5000;

export function BookmarkList() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(SEED);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [removed, setRemoved] = useState<Bookmark | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) setBookmarks(JSON.parse(saved) as Bookmark[]);
  }, []);

  const save = (next: Bookmark[]) => {
    setBookmarks(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  useEffect(() => clearTimer, []);

  const onRemove = (bookmark: Bookmark) => {
    save(removeBookmark(bookmarks, bookmark.id));
    clearTimer();
    setRemoved(bookmark);
    timer.current = setTimeout(() => {
      timer.current = null;
      setRemoved(null);
    }, TOAST_MS);
  };

  const onUndo = () => {
    if (!removed) return;
    try {
      save(restoreBookmark(bookmarks, removed));
      setError(null);
      clearTimer();
      setRemoved(null);
    } catch (caught) {
      setError(caught instanceof BookmarkError ? caught.message : 'could not restore the bookmark');
    }
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

  return (
    <section className="bookmarks">
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
      <ul className="list" data-testid="bookmark-list">
        {sortBookmarks(bookmarks).map((bookmark) => (
          <li key={bookmark.id} className="item" data-testid="bookmark-item">
            <a href={bookmark.url} target="_blank" rel="noreferrer">
              <span className="item-title">{bookmark.title}</span>
              <span className="item-url">{new URL(bookmark.url).hostname}</span>
            </a>
            <button type="button" aria-label={`Remove ${bookmark.title}`} onClick={() => onRemove(bookmark)}>
              ×
            </button>
          </li>
        ))}
      </ul>
      <div role="status" className={removed ? 'toast' : undefined}>
        {removed && (
          <>
            <span>Bookmark removed</span>
            <button type="button" onClick={onUndo}>
              Undo
            </button>
          </>
        )}
      </div>
    </section>
  );
}
