'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useTranslations } from 'next-intl'
import { Activity, TrendingUp, Target, Clock } from 'lucide-react'
import { StatsChart } from './StatsChart'
import { HealthReminder } from './HealthReminder'

interface SummaryStats {
  today: {
    count: number
    duration: number
  }
  week: {
    count: number
    duration: number
  }
  month: {
    count: number
    duration: number
  }
  dailyData: Array<{
    date: string
    count: number
    duration: number
  }>
  monthlyData: Array<{
    date: string
    count: number
    duration: number
  }>
}

interface StatsDisplayProps {
  initialStats: SummaryStats
  dailyGoal: number
  notificationsEnabled: boolean
}

/**
 * 统计数据展示组件
 * 需求: 8.2 - 展示每日、每周和每月的运动次数
 * 需求: 8.5 - 使用可视化图表展示运动趋势
 */
export function StatsDisplay({ initialStats, dailyGoal, notificationsEnabled }: StatsDisplayProps) {
  const t = useTranslations('stats')
  const [stats] = useState<SummaryStats>(initialStats)

  // 格式化时长（秒转为分钟）
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return minutes > 0 ? `${minutes}${t('minutes')}` : `${remainingSeconds}${t('seconds')}`
  }

  // 计算今日进度
  const todayProgress = Math.min((stats.today.count / dailyGoal) * 100, 100)

  return (
    <div className="space-y-6">
      {/* 健康提醒组件 */}
      <HealthReminder
        dailyGoal={dailyGoal}
        currentCount={stats.today.count}
        notificationsEnabled={notificationsEnabled}
      />

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* 今日统计 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('today')}</CardTitle>
            <Activity className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.today.count}</div>
            <p className="text-muted-foreground text-xs">
              {t('rotationCount')} · {formatDuration(stats.today.duration)}
            </p>
            <div className="mt-2">
              <div className="bg-secondary h-2 w-full overflow-hidden rounded-full">
                <div
                  className="bg-primary h-full transition-all"
                  style={{ width: `${todayProgress}%` }}
                />
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                {t('goal')}: {dailyGoal}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 本周统计 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('week')}</CardTitle>
            <TrendingUp className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.week.count}</div>
            <p className="text-muted-foreground text-xs">
              {t('rotationCount')} · {formatDuration(stats.week.duration)}
            </p>
            <p className="text-muted-foreground mt-2 text-xs">
              {t('average')}: {Math.round(stats.week.count / 7)} {t('perDay')}
            </p>
          </CardContent>
        </Card>

        {/* 本月统计 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('month')}</CardTitle>
            <Target className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.month.count}</div>
            <p className="text-muted-foreground text-xs">
              {t('rotationCount')} · {formatDuration(stats.month.duration)}
            </p>
            <p className="text-muted-foreground mt-2 text-xs">
              {t('average')}: {Math.round(stats.month.count / 30)} {t('perDay')}
            </p>
          </CardContent>
        </Card>

        {/* 总时长 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalDuration')}</CardTitle>
            <Clock className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(stats.month.duration / 60)}</div>
            <p className="text-muted-foreground text-xs">
              {t('minutes')} · {t('thisMonth')}
            </p>
            <p className="text-muted-foreground mt-2 text-xs">
              {t('dailyAverage')}: {Math.round(stats.month.duration / 30 / 60)} {t('minutes')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 图表 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('weeklyTrend')}</CardTitle>
            <CardDescription>{t('last7Days')}</CardDescription>
          </CardHeader>
          <CardContent>
            <StatsChart data={stats.dailyData} type="week" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('monthlyTrend')}</CardTitle>
            <CardDescription>{t('last30Days')}</CardDescription>
          </CardHeader>
          <CardContent>
            <StatsChart data={stats.monthlyData} type="month" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
