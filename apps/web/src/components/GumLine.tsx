/** Scalloped line echoing the gum margin around a row of teeth. Decorative. */
export function GumLine({ className = '' }: { className?: string }) {
  // One scallop per 60 units; the viewBox is stretched to the container width
  const scallops = 24;
  const w = 60;
  let d = 'M0 4';
  for (let i = 0; i < scallops; i++) {
    const x = i * w;
    d += ` C${x + 12} 4 ${x + 18} 20 ${x + 30} 20 C${x + 42} 20 ${x + 48} 4 ${x + 60} 4`;
  }
  return (
    <svg
      aria-hidden="true"
      className={`block w-full h-5 ${className}`}
      viewBox={`0 0 ${scallops * w} 24`}
      preserveAspectRatio="none"
    >
      <path d={`${d} V24 H0 Z`} fill="var(--color-paper)" />
      <path d={d} fill="none" stroke="var(--color-gum)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
