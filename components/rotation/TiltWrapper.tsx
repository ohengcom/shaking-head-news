'use client'

import { motion } from 'framer-motion'
import { useRotationStore } from '@/lib/stores/rotation-store'
import { useEffect, useState, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { recordRotation } from '@/lib/actions/stats'
import { cn } from '@/lib/utils'

interface TiltWrapperProps {
  children: React.ReactNode
  mode?: 'fixed' | 'continuous'
  interval?: number
}

interface PendingRotation {
  angle: number
  duration: number
}

const BATCH_INTERVAL_MS = 5 * 60 * 1000 // Flush every 5 minutes

export function TiltWrapper({
  children,
  mode: propMode,
  interval: propInterval,
}: TiltWrapperProps) {
  const { angle, setAngle, isPaused, mode, interval } = useRotationStore()
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const lastRotationTime = useRef<number>(Date.now())
  const previousAngle = useRef<number>(0)
  const pendingRotations = useRef<PendingRotation[]>([])
  const pathname = usePathname()

  // Use props if provided, otherwise use store values
  const effectiveMode = propMode ?? mode
  const effectiveInterval = propInterval ?? interval

  // Disable rotation on settings and RSS pages
  const isSettingsPage = pathname === '/settings' || pathname === '/rss'

  // Flush pending rotations to server (batch upload)
  const flushRotations = useCallback(() => {
    const batch = pendingRotations.current
    if (batch.length === 0) return
    pendingRotations.current = []

    // Send the latest rotation as a summary (total count preserved in duration sum)
    const lastEntry = batch[batch.length - 1]
    if (!lastEntry) return
    const totalDuration = batch.reduce((sum, r) => sum + r.duration, 0)
    recordRotation(lastEntry.angle, totalDuration).catch(() => {
      // Silent failure — stats are non-critical
    })
  }, [])

  // Flush rotations on page unload
  useEffect(() => {
    const handleUnload = () => {
      if (pendingRotations.current.length > 0) {
        const batch = pendingRotations.current
        const lastEntry = batch[batch.length - 1]
        if (!lastEntry) return
        const totalDuration = batch.reduce((sum, r) => sum + r.duration, 0)
        // Use sendBeacon for reliable page-unload reporting
        const data = JSON.stringify({ angle: lastEntry.angle, duration: totalDuration })
        navigator.sendBeacon?.('/api/stats/rotation', data)
      }
    }
    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [])

  // Periodically flush rotation batch
  useEffect(() => {
    const timer = setInterval(flushRotations, BATCH_INTERVAL_MS)
    return () => {
      clearInterval(timer)
      flushRotations() // Flush on cleanup
    }
  }, [flushRotations])

  // Manually rehydrate zustand store after mount
  useEffect(() => {
    try {
      useRotationStore.persist.rehydrate()
    } catch (e) {
      console.error('Rehydration failed:', e)
    }
    setIsHydrated(true)
  }, [])

  // Check for prefers-reduced-motion
  useEffect(() => {
    // We intentionally ignore prefers-reduced-motion to ensure the "shaking" feature
    // works on all systems (including Cloud PCs/VMs that might default to reduced motion).
    // The feature is core to the application's purpose.
    if (typeof window === 'undefined') return
    setPrefersReducedMotion(false)
  }, [])

  // Reset angle to 0 on settings page
  useEffect(() => {
    if (isSettingsPage) {
      setAngle(0)
    }
  }, [isSettingsPage, setAngle])

  // Handle rotation logic
  useEffect(() => {
    if (!isHydrated) return

    if (isPaused || effectiveMode === 'fixed' || prefersReducedMotion || isSettingsPage) {
      return
    }

    // Continuous mode: change angle at intervals
    const timer = setInterval(() => {
      // Generate random angle with absolute value between 5 and 20 degrees
      const angleMagnitude = Math.random() * 15 + 5 // 5 to 20
      const sign = Math.random() < 0.5 ? 1 : -1
      const newAngle = angleMagnitude * sign
      setAngle(newAngle)

      // Buffer rotation for batch reporting
      const now = Date.now()
      const duration = Math.round((now - lastRotationTime.current) / 1000)
      lastRotationTime.current = now

      // Only buffer if there's a significant angle change
      if (Math.abs(newAngle - previousAngle.current) > 0.5) {
        pendingRotations.current.push({ angle: newAngle, duration })
        previousAngle.current = newAngle
      }
    }, effectiveInterval * 1000)

    return () => clearInterval(timer)
  }, [
    effectiveMode,
    effectiveInterval,
    isPaused,
    prefersReducedMotion,
    isSettingsPage,
    setAngle,
    isHydrated,
  ])

  // Handle manual mode (mouse follow)
  useEffect(() => {
    if (!isHydrated) return

    if (effectiveMode === 'fixed' && !prefersReducedMotion && !isSettingsPage) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const handleMouseMove = (e: any) => {
        const xFactor = (e.clientX / window.innerWidth) * 2 - 1
        const targetAngle = xFactor * 15
        setAngle(targetAngle)
      }

      window.addEventListener('mousemove', handleMouseMove)
      return () => window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [effectiveMode, prefersReducedMotion, isSettingsPage, setAngle, isHydrated])

  // If user prefers reduced motion, render without animation
  if (prefersReducedMotion) {
    return (
      <div
        className={cn(
          'h-screen overflow-x-hidden overflow-y-auto',
          !isSettingsPage && 'scrollbar-hide'
        )}
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
