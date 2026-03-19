'use client'

import { motion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { recordRotation } from '@/lib/actions/stats'
import { useRotationStore } from '@/lib/stores/rotation-store'
import { cn } from '@/lib/utils'

interface TiltWrapperProps {
  children: React.ReactNode
  initialMode?: 'fixed' | 'continuous'
  initialInterval?: number
  initialAnimationEnabled?: boolean
}

interface PendingRotation {
  angle: number
  duration: number
}

const BATCH_INTERVAL_MS = 5 * 60 * 1000

export function TiltWrapper({
  children,
  initialMode,
  initialInterval,
  initialAnimationEnabled,
}: TiltWrapperProps) {
  const { angle, setAngle, isPaused, mode, interval } = useRotationStore()
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const lastRotationTime = useRef<number>(Date.now())
  const previousAngle = useRef<number>(0)
  const pendingRotations = useRef<PendingRotation[]>([])
  const pathname = usePathname()

  const effectiveMode = isHydrated ? mode : (initialMode ?? mode)
  const effectiveInterval = isHydrated ? interval : (initialInterval ?? interval)
  const effectiveIsPaused = isHydrated ? isPaused : initialAnimationEnabled === false
  const isSettingsPage = pathname === '/settings' || pathname === '/rss'

  const flushRotations = useCallback(() => {
    const batch = pendingRotations.current
    if (batch.length === 0) {
      return
    }

    pendingRotations.current = []

    const lastEntry = batch[batch.length - 1]
    if (!lastEntry) {
      return
    }

    const totalDuration = batch.reduce((sum, rotation) => sum + rotation.duration, 0)
    recordRotation(lastEntry.angle, totalDuration).catch(() => {
      // Stats are non-critical and should not block rendering.
    })
  }, [])

  useEffect(() => {
    const handleUnload = () => {
      if (pendingRotations.current.length === 0) {
        return
      }

      const batch = pendingRotations.current
      const lastEntry = batch[batch.length - 1]
      if (!lastEntry) {
        return
      }

      const totalDuration = batch.reduce((sum, rotation) => sum + rotation.duration, 0)
      const data = JSON.stringify({ angle: lastEntry.angle, duration: totalDuration })
      navigator.sendBeacon?.('/api/stats/rotation', data)
    }

    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [])

  useEffect(() => {
    const timer = setInterval(flushRotations, BATCH_INTERVAL_MS)

    return () => {
      clearInterval(timer)
      flushRotations()
    }
  }, [flushRotations])

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => {
      setPrefersReducedMotion(mediaQuery.matches)
    }

    updatePreference()
    mediaQuery.addEventListener('change', updatePreference)

    return () => mediaQuery.removeEventListener('change', updatePreference)
  }, [])

  useEffect(() => {
    if (isSettingsPage || prefersReducedMotion) {
      setAngle(0)
    }
  }, [isSettingsPage, prefersReducedMotion, setAngle])

  useEffect(() => {
    if (!isHydrated) {
      return
    }

    if (effectiveIsPaused || effectiveMode === 'fixed' || prefersReducedMotion || isSettingsPage) {
      return
    }

    const timer = setInterval(() => {
      const angleMagnitude = Math.random() * 15 + 5
      const sign = Math.random() < 0.5 ? 1 : -1
      const newAngle = angleMagnitude * sign
      setAngle(newAngle)

      const now = Date.now()
      const duration = Math.round((now - lastRotationTime.current) / 1000)
      lastRotationTime.current = now

      if (Math.abs(newAngle - previousAngle.current) > 0.5) {
        pendingRotations.current.push({ angle: newAngle, duration })
        previousAngle.current = newAngle
      }
    }, effectiveInterval * 1000)

    return () => clearInterval(timer)
  }, [
    effectiveInterval,
    effectiveIsPaused,
    effectiveMode,
    isHydrated,
    isSettingsPage,
    prefersReducedMotion,
    setAngle,
  ])

  useEffect(() => {
    if (!isHydrated) {
      return
    }

    if (effectiveMode !== 'fixed' || prefersReducedMotion || isSettingsPage) {
      return
    }

    const handleMouseMove = (event: MouseEvent) => {
      const xFactor = (event.clientX / window.innerWidth) * 2 - 1
      const targetAngle = xFactor * 15
      setAngle(targetAngle)
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [effectiveMode, isHydrated, isSettingsPage, prefersReducedMotion, setAngle])

  if (prefersReducedMotion) {
    return (
      <div
        className={cn(
          'h-screen overflow-x-hidden overflow-y-auto',
          !isSettingsPage && 'scrollbar-hide'
        )}
        data-testid="tilt-wrapper"
      >
        {children}
      </div>
    )
  }

  return (
    <motion.div
      animate={{ rotate: angle }}
      transition={{ duration: 0.6, ease: 'easeInOut' }}
      className={cn(
        'h-screen overflow-x-hidden overflow-y-auto',
        !isSettingsPage && 'scrollbar-hide'
      )}
      data-testid="tilt-wrapper"
    >
      {children}
    </motion.div>
  )
}
