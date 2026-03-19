'use client'

import { useLayoutEffect } from 'react'
import { useTheme } from 'next-themes'
import type { UserSettings } from '@/types/settings'
import { useRotationStore } from '@/lib/stores/rotation-store'
import { useUIStore } from '@/lib/stores/ui-store'

interface AppRuntimeSettingsProps {
  initialSettings: UserSettings | null
}

export function AppRuntimeSettings({ initialSettings }: AppRuntimeSettingsProps) {
  const { setTheme } = useTheme()

  useLayoutEffect(() => {
    if (initialSettings?.userId) {
      useUIStore.setState({
        fontSize: initialSettings.fontSize,
        layoutMode: initialSettings.layoutMode,
      })

      useRotationStore.setState({
        angle: 0,
        isPaused: !initialSettings.animationEnabled,
        mode: initialSettings.rotationMode,
        interval: initialSettings.rotationInterval,
      })

      setTheme(initialSettings.theme)
      return
    }

    void useUIStore.persist.rehydrate()
    void useRotationStore.persist.rehydrate()
  }, [initialSettings, setTheme])

  return null
}
