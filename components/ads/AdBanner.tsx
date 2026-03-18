'use client'

import { useEffect } from 'react'
import { cn } from '@/lib/utils'

interface AdBannerProps {
  position?: 'sidebar' | 'header' | 'footer' | 'inline'
  size?: 'small' | 'medium' | 'large'
  className?: string
  adSlot?: string
  enabled?: boolean
}

export function AdBanner({
  position = 'sidebar',
  size = 'medium',
  className,
  adSlot,
  enabled = true,
}: AdBannerProps) {
  if (!enabled) {
    return null
  }

  const adDimensions = getAdDimensions(position, size)

  return (
    <div
      className={cn(
        'ad-banner border-border/50 bg-muted/30 overflow-hidden rounded-lg border',
        adDimensions.containerClass,
        className
      )}
      data-ad-position={position}
      data-ad-size={size}
    >
      {process.env.NODE_ENV === 'development' || !process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID ? (
        <AdPlaceholder position={position} size={size} />
      ) : (
        <GoogleAdSense adSlot={adSlot || getDefaultAdSlot(position)} style={adDimensions.style} />
      )}
    </div>
  )
}

function AdPlaceholder({
  position,
  size,
  className,
}: {
  position: string
  size: string
  className?: string
}) {
  const dimensions = getAdDimensions(
    position as AdBannerProps['position'],
    size as AdBannerProps['size']
  )

  return (
    <div
      className={cn(
        'from-muted/50 to-muted text-muted-foreground flex items-center justify-center bg-gradient-to-br',
        dimensions.containerClass,
        className
      )}
      style={dimensions.style}
    >
      <div className="text-center">
        <p className="text-xs font-medium">Ad Slot</p>
        <p className="text-[10px] opacity-70">
          {position} - {size}
        </p>
      </div>
    </div>
  )
}

function GoogleAdSense({ adSlot, style }: { adSlot: string; style: React.CSSProperties }) {
  useEffect(() => {
    try {
      if (
        typeof window !== 'undefined' &&
        (window as unknown as { adsbygoogle?: unknown[] }).adsbygoogle
      ) {
        ;(window as unknown as { adsbygoogle: unknown[] }).adsbygoogle.push({})
      }
    } catch (error) {
      console.error('AdSense error:', error)
    }
  }, [])

  return (
    <ins
      className="adsbygoogle"
      style={{ display: 'block', ...style }}
      data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}
      data-ad-slot={adSlot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  )
}

function getAdDimensions(
  position: AdBannerProps['position'],
  size: AdBannerProps['size']
): {
  containerClass: string
  style: React.CSSProperties
} {
  const configs = {
    sidebar: {
      small: { containerClass: 'w-full', style: { minHeight: '100px' } },
      medium: { containerClass: 'w-full', style: { minHeight: '250px' } },
      large: { containerClass: 'w-full', style: { minHeight: '400px' } },
    },
    header: {
      small: { containerClass: 'w-full h-[50px]', style: { height: '50px' } },
      medium: { containerClass: 'w-full h-[90px]', style: { height: '90px' } },
      large: { containerClass: 'w-full h-[120px]', style: { height: '120px' } },
    },
    footer: {
      small: { containerClass: 'w-full h-[50px]', style: { height: '50px' } },
      medium: { containerClass: 'w-full h-[90px]', style: { height: '90px' } },
      large: { containerClass: 'w-full h-[120px]', style: { height: '120px' } },
    },
    inline: {
      small: { containerClass: 'w-full', style: { minHeight: '100px' } },
      medium: { containerClass: 'w-full', style: { minHeight: '200px' } },
      large: { containerClass: 'w-full', style: { minHeight: '300px' } },
    },
  }

  const positionConfig = configs[position || 'sidebar']
  if (!positionConfig) return configs.sidebar.medium

  const sizeConfig = positionConfig[size || 'medium']
  return sizeConfig || configs.sidebar.medium
}

function getDefaultAdSlot(position: AdBannerProps['position']): string {
  const slots: Record<string, string> = {
    sidebar: process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR || '',
    header: process.env.NEXT_PUBLIC_ADSENSE_SLOT_HEADER || '',
    footer: process.env.NEXT_PUBLIC_ADSENSE_SLOT_FOOTER || '',
    inline: process.env.NEXT_PUBLIC_ADSENSE_SLOT_INLINE || '',
  }

  return slots[position || 'sidebar'] || ''
}

export default AdBanner
