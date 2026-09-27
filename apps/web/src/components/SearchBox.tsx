import type { AudienceParam } from '@/lib/types';

export function SearchBox({
  audience,
  defaultValue = '',
  size = 'large',
}: {
  audience?: AudienceParam;
  defaultValue?: string;
  size?: 'large' | 'small';
}) {
  const placeholder =
    audience === 'dentist'
      ? 'Search: staging, furcation, peri-implantitis…'
      : 'Search: bleeding gums, loose tooth, scaling…';
  return (
    <form action="/search" method="get" role="search" className="flex w-full max-w-2xl gap-2">
      {audience && <input type="hidden" name="for" value={audience} />}
      <label htmlFor="site-search" className="sr-only">
        Search questions and articles
      </label>
      <input
        id="site-search"
        name="q"
        type="search"
        defaultValue={defaultValue}
        placeholder={placeholder}
        maxLength={200}
        className={`input flex-1 ${size === 'large' ? 'py-3 text-lg' : ''}`}
      />
      <button type="submit" className={`btn ${size === 'large' ? 'px-6' : ''}`}>
        Search
      </button>
    </form>
  );
}
