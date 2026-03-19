'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Sun className="h-5 w-5" />
      </Button>
    )
  }

  const activeTheme = resolvedTheme ?? 'light'

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(activeTheme === 'dark' ? 'light' : 'dark')}
      aria-label={activeTheme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
    >
      {activeTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  )
}
