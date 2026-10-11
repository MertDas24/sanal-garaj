import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

type Kind = 'ok' | 'error';
interface Toast { text: string; kind: Kind; link?: { href: string; label: string } }

/** Kısa süreli bildirim; ekran okuyuculara aria-live ile duyurulur. */
export function useToast(): { toast: ReactNode; show(text: string, kind?: Kind, link?: Toast['link']): void } {
  const [t, setT] = useState<Toast | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const show = useCallback((text: string, kind: Kind = 'ok', link?: Toast['link']) => {
    setT({ text, kind, link });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setT(null), 4500);
  }, []);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const toast = (
    <div className="toast-region" aria-live="polite" role="status">
      {t && (
        <div className={`toast toast--${t.kind}`}>
          <span>{t.text}</span>
          {t.link && <a href={t.link.href}>{t.link.label}</a>}
        </div>
      )}
    </div>
  );
  return { toast, show };
}
