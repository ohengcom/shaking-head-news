import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface RotationState {
  angle: number
  isPaused: boolean
  mode: 'fixed' | 'continuous'
  interval: number
  setAngle: (angle: number) => void
  togglePause: () => void
  setMode: (mode: 'fixed' | 'continuous') => void
  setInterval: (interval: number) => void
  reset: () => void
}

const DEFAULT_STATE = {
  angle: 0,
  isPaused: false,
  mode: 'continuous' as const,
  interval: 10,
}

export const useRotationStore = create<RotationState>()(
  persist(
    (set) => ({
      ...DEFAULT_STATE,
      setAngle: (angle) => set({ angle }),
      togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
      setMode: (mode) => set({ mode }),
      setInterval: (interval) => set({ interval }),
      reset: () => set(DEFAULT_STATE),
    }),
    {
      name: 'rotation-storage',
      // Skip automatic hydration for SSR compatibility
      // Manual rehydration is triggered in AppRuntimeSettings after mount
      skipHydration: true,
      // Only persist preferences; `angle` changes on every rotation tick and
      // mousemove, and `isPaused` is session-scoped, so persisting either would
      // hammer localStorage and restore a tilted page on reload.
      partialize: (state) => ({ mode: state.mode, interval: state.interval }),
    }
  )
)
