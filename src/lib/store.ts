import { useSyncExternalStore } from 'react'

// Petit état global : fin du préchargement, 3D prête, etc.
type State = { sceneReady: boolean; introDone: boolean; menuOpen: boolean }

let state: State = { sceneReady: false, introDone: false, menuOpen: false }
const listeners = new Set<() => void>()

export const store = {
  get: () => state,
  set(patch: Partial<State>) {
    state = { ...state, ...patch }
    listeners.forEach((l) => l())
  },
  subscribe(l: () => void) {
    listeners.add(l)
    return () => listeners.delete(l)
  },
}

export function useStore<T>(select: (s: State) => T): T {
  return useSyncExternalStore(store.subscribe, () => select(state), () => select(state))
}

// Valeurs lues à chaque image par la scène 3D (pas de re-rendu React).
export const heroScroll = { p: 0 }
export const pointer = { x: 0, y: 0 }
