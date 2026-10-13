import { useState } from 'react';
import type { Route } from '../lib/router';

const LINKS: { href: string; label: string; match: Route['name'][] }[] = [
  { href: '#/', label: 'Katalog', match: ['catalog', 'editor'] },
  { href: '#/karsilastir', label: 'Karşılaştır', match: ['compare'] },
  { href: '#/tasarimlarim', label: 'Tasarımlarım', match: ['saved'] },
  { href: '#/foto', label: 'Fotoğrafta dene', match: ['photo'] },
  { href: '#/kendi-modelin', label: 'Kendi modelin', match: ['custom'] },
  { href: '#/kaynaklar', label: 'Kaynaklar', match: ['credits'] },
  { href: '#/hakkinda', label: 'Hakkında', match: ['about'] },
];

export function Header({ route }: { route: Route }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="header">
      <a className="brand" href="#/" onClick={() => setOpen(false)}>
        <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true">
          <path d="M4 20l3-7a4 4 0 0 1 3.7-2.5h10.6A4 4 0 0 1 25 13l3 7v5a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-1H8v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <circle cx="9.5" cy="19.5" r="1.8" fill="currentColor" />
          <circle cx="22.5" cy="19.5" r="1.8" fill="currentColor" />
        </svg>
        <span>Sanal Garaj</span>
      </a>
      <button
        className="nav-toggle"
        aria-expanded={open}
        aria-controls="ana-menu"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="sr-only">Menü</span>
        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
      </button>
      <nav id="ana-menu" className={open ? 'nav nav--open' : 'nav'} aria-label="Ana menü">
        {LINKS.map((l) => (
          <a
            key={l.href}
            href={l.href}
            aria-current={l.match.includes(route.name) ? 'page' : undefined}
            onClick={() => setOpen(false)}
          >
            {l.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
