import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type FontSize = 'small' | 'medium' | 'large' | 'xlarge'
export type LayoutMode = 'normal' | 'compact'

interface UIState {
  fontSize: FontSize
  layoutMode: LayoutMode
  setFontSize: (size: FontSize) => void
  setLayoutMode: (mode: LayoutMode) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      fontSize: 'medium',
      layoutMode: 'normal',
      setFontSize: (fontSize) => set({ fontSize }),
      setLayoutMode: (layoutMode) => set({ layoutMode }),
    }),
    {
      name: 'ui-storage',
      skipHydration: true,
    }
  )
)
