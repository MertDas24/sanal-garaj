import type { KeyboardEvent } from 'react';
/** Radyo düğmelerinde ok/Home/End seçimi; kapalı seçenekler atlanır. */
export function radioKeys(e: KeyboardEvent<HTMLDivElement>) {
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) return;
  const buttons = [...e.currentTarget.querySelectorAll<HTMLButtonElement>('button[role="radio"]')].filter((b) => !b.matches(':disabled'));
  const current = buttons.indexOf(e.target as HTMLButtonElement);
  if (current < 0 || !buttons.length) return;
  e.preventDefault();
  const index = e.key === 'Home' ? 0 : e.key === 'End' ? buttons.length - 1 :
    (current + (e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 1) + buttons.length) % buttons.length;
  buttons[index].focus(); buttons[index].click();
}
