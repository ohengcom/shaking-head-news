import { Suspense } from 'react'
import { getSummaryStats } from '@/lib/actions/stats'
import { getUserSettings } from '@/lib/actions/settings'
import { StatsDisplay } from '@/components/stats/StatsDisplay'
import { BlurredStats } from '@/components/stats/BlurredStats'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getUserTier } from '@/lib/tier-server'

/**
 * 统计页面加载骨架屏
 */
function StatsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="mb-2 h-4 w-20" />
              <Skeleton className="mb-2 h-8 w-16" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/**
 * 统计页面内容
 * 根据用户层级显示不同内容：
 * - Guest: 显示模糊统计 + 登录提示
 * - Member: 显示模糊预览 + 升级提示
 * - Pro: 显示完整统计
 */
async function StatsContent() {
  const { tier, features } = await getUserTier()

  // Guest 和 Member 用户显示模糊统计
  if (!features.statsFullEnabled) {
    return <BlurredStats tier={tier} />
  }

  // Pro 用户显示完整统计
  try {
    // 获取用户设置（获取每日目标）
    const settings = await getUserSettings()
    const dailyGoal = settings.dailyGoal || 30
    const notificationsEnabled = settings.notificationsEnabled ?? true

    // 获取统计数据
    const stats = await getSummaryStats()

    return (
      <StatsDisplay
        initialStats={stats}
        dailyGoal={dailyGoal}
        notificationsEnabled={notificationsEnabled}
      />
    )
  } catch (error) {
    console.error('[StatsPage] Error loading stats:', error)

    // 返回错误提示而不是崩溃
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="py-8 text-center">
            <p className="text-destructive mb-2">加载统计数据时出错</p>
            <p className="text-muted-foreground text-sm">
              {error instanceof Error ? error.message : '请稍后重试'}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }
}

/**
 * 统计页面
 * 需求: 8.2 - 创建统计页面展示运动数据
 * 需求: 8.5 - 提供可视化图表
 */
export default function StatsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">统计数据</h1>
        <p className="text-muted-foreground mt-2">查看您的颈椎运动统计和健康趋势</p>
      </div>

      <Suspense fallback={<StatsLoadingSkeleton />}>
        <StatsContent />
      </Suspense>
    </div>
  )
}

/**
 * 页面元数据
 */
export const dynamic = 'force-dynamic'
export const metadata = {
  title: '统计数据 - 摇头看新闻',
  description: '查看您的颈椎运动统计和健康趋势',
}
