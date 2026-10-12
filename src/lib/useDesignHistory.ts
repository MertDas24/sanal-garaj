import { useCallback, useState } from 'react';
import type { Design } from './design';

const LIMIT = 50;
export interface DesignHistory { past: Design[]; present: Design | null; future: Design[] }
export function moveHistory(state: DesignHistory, direction: 'undo' | 'redo'): DesignHistory {
  if (direction === 'undo') {
    if (!state.past.length || !state.present) return state;
    return { past: state.past.slice(0, -1), present: state.past.at(-1)!, future: [state.present, ...state.future] };
  }
  if (!state.future.length || !state.present) return state;
  return { past: [...state.past, state.present].slice(-LIMIT), present: state.future[0], future: state.future.slice(1) };
}
export function pushHistory(state: DesignHistory, design: Design): DesignHistory {
  if (JSON.stringify(state.present) === JSON.stringify(design)) return state;
  return { past: state.present ? [...state.past, state.present].slice(-LIMIT) : [], present: design, future: [] };
}
export function useDesignHistory() {
  const [state, setState] = useState<DesignHistory>({ past: [], present: null, future: [] });
  const setDesign = useCallback((design: Design) => setState((s) => pushHistory(s, design)), []);
  const reset = useCallback((design: Design) => setState({ past: [], present: design, future: [] }), []);
  const undo = useCallback(() => setState((s) => moveHistory(s, 'undo')), []);
  const redo = useCallback(() => setState((s) => moveHistory(s, 'redo')), []);
  return { design: state.present, setDesign, reset, undo, redo, canUndo: !!state.past.length, canRedo: !!state.future.length };
}
