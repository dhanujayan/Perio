'use client';

import { useEffect, useId, useState } from 'react';

type Common = {
  label: string;
  name: string;
  hint?: string;
  error?: string;
  required?: boolean;
  defaultValue?: string;
  maxLength?: number;
};

export function TextField({
  type = 'text',
  autoComplete,
  minLength,
  ...p
}: Common & { type?: string; autoComplete?: string; minLength?: number }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>
        {p.label}
        {!p.required && <span className="font-normal text-ink-soft"> (optional)</span>}
      </label>
      {p.hint && (
        <p id={`${id}-hint`} className="hint">
          {p.hint}
        </p>
      )}
      <input
        id={id}
        name={p.name}
        type={type}
        required={p.required}
        defaultValue={p.defaultValue}
        maxLength={p.maxLength}
        minLength={minLength}
        autoComplete={autoComplete}
        aria-invalid={p.error ? true : undefined}
        aria-describedby={[p.hint && `${id}-hint`, p.error && `${id}-err`].filter(Boolean).join(' ') || undefined}
        className="input"
      />
      {p.error && (
        <p id={`${id}-err`} className="error">
          {p.error}
        </p>
      )}
    </div>
  );
}

export function TextArea(p: Common & { rows?: number }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>
        {p.label}
        {!p.required && <span className="font-normal text-ink-soft"> (optional)</span>}
      </label>
      {p.hint && (
        <p id={`${id}-hint`} className="hint">
          {p.hint}
        </p>
      )}
      <textarea
        id={id}
        name={p.name}
        required={p.required}
        defaultValue={p.defaultValue}
        maxLength={p.maxLength}
        rows={p.rows}
        aria-invalid={p.error ? true : undefined}
        aria-describedby={[p.hint && `${id}-hint`, p.error && `${id}-err`].filter(Boolean).join(' ') || undefined}
        className="input"
      />
      {p.error && (
        <p id={`${id}-err`} className="error">
          {p.error}
        </p>
      )}
    </div>
  );
}

/** Hidden from people and screen readers; bots that fill every field reveal themselves. */
export function Honeypot() {
  return (
    <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
      <label>
        Website
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
      {message}
    </p>
  );
}

/** Only allow redirects to paths on this site. */
export function safeNext(next: string | null | undefined, fallback = '/') {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : fallback;
}

/**
 * False until React has hydrated. Submit buttons stay disabled until then, so a fast tap on a slow
 * connection cannot trigger a native form submit (which would put the fields in the URL).
 */
export function useHydrated() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return ready;
}
