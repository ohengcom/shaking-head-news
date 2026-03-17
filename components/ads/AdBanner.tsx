/**
 * AdBanner Component
 * 广告横幅组件
 *
 * 根据用户层级显示/隐藏广告：
 * - Guest: 强制显示广告
 * - Member: 强制显示广告
 * - Pro: 可根据设置显示/隐藏
 */

'use client'

import { useEffect, useState } from 'react'
import { useUserTier } from '@/hooks/use-user-tier'
import { cn } from '@/lib/utils'

interface AdBannerProps {
  /** 广告位置 */
  position?: 'sidebar' | 'header' | 'footer' | 'inline'
  /** 广告尺寸 */
  size?: 'small' | 'medium' | 'large'
  /** 自定义类名 */
  className?: string
  /** 广告单元 ID (Google AdSense) */
  adSlot?: string
  /** 初始 Pro 状态 (用于服务端渲染) */
  initialIsPro?: boolean
}

/**
 * 广告横幅组件
 * 使用 Google AdSense 显示广告
 */
export function AdBanner({
  position = 'sidebar',
  size = 'medium',
  className,
  adSlot,
  initialIsPro,
}: AdBannerProps) {
  const { isPro, features } = useUserTier({ initialIsPro })
  const [adsEnabled, setAdsEnabled] = useState(true)
  const [isClient, setIsClient] = useState(false)

  // 确保在客户端渲染
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Pro 用户可以关闭广告
  useEffect(() => {
    const checkAdsPreference = () => {
      if (isPro && features.adsDisableable) {
        // 从用户设置中获取广告偏好
        const savedPreference = localStorage.getItem('adsEnabled')
        if (savedPreference !== null) {
          setAdsEnabled(savedPreference === 'true')
        }
      } else {
        // Guest 和 Member 强制显示广告
        setAdsEnabled(true)
      }
    }

    checkAdsPreference()

    // Listen for setting changes
    window.addEventListener('ads-preference-changed', checkAdsPreference)
    return () => window.removeEventListener('ads-preference-changed', checkAdsPreference)
  }, [isPro, features.adsDisableable])

  // 如果 Pro 用户关闭了广告，不渲染
  if (isPro && features.adsDisableable && !adsEnabled) {
    return null
  }

  // 服务端渲染时返回占位符
  if (!isClient) {
    return <AdPlaceholder position={position} size={size} className={className} />
  }

  // 根据位置和尺寸确定广告尺寸
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
      {/* 开发环境显示占位符 */}
      {process.env.NODE_ENV === 'development' ? (
        <AdPlaceholder position={position} size={size} />
      ) : (
        <GoogleAdSense adSlot={adSlot || getDefaultAdSlot(position)} style={adDimensions.style} />
      )}
    </div>
  )
}

/**
 * 广告占位符（开发环境使用）
 */
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
        <p className="text-xs font-medium">广告位</p>
        <p className="text-[10px] opacity-70">
          {position} - {size}
        </p>
      </div>
    </div>
  )
}

/**
 * Google AdSense 组件
 */
function GoogleAdSense({ adSlot, style }: { adSlot: string; style: React.CSSProperties }) {
  useEffect(() => {
    try {
      // 加载 AdSense 脚本
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

/**
 * 获取广告尺寸配置
 */
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

/**
 * 获取默认广告位 ID
 */
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
