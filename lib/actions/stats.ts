'use server'

import { auth } from '@/lib/auth'
import { getStorageItem, setStorageItem, getMultipleStorageItems, StorageKeys } from '@/lib/storage'
import { UserStatsSchema, RotationRecord, UserStats } from '@/types/stats'
import { AuthError, logError, validateOrThrow } from '@/lib/utils/error-handler'
import { rateLimitByUser, RateLimitTiers } from '@/lib/rate-limit'

/**
 * 记录旋转动作
 * 需求: 8.1 - 完成旋转周期时存储运动记录
 * 包含速率限制以防止滥用
 */
export async function recordRotation(angle: number, duration: number) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      // Guest user (no session) - seamlessly skip recording without error
      return { error: 'UNAUTHORIZED' }
    }

    // 速率限制：防止滥用
    const rateLimitResult = await rateLimitByUser(session.user.id, {
      ...RateLimitTiers.RELAXED,
    })

    if (!rateLimitResult.success) {
      console.warn('Rate limit exceeded for recordRotation')
      return { error: 'RATE_LIMIT' }
    }

    // 验证输入参数
    if (typeof angle !== 'number' || typeof duration !== 'number') {
      throw new Error('Invalid input parameters')
    }

    // 限制角度范围 (-180 到 180)
    if (angle < -180 || angle > 180) {
      throw new Error('Angle must be between -180 and 180')
    }

    // 限制持续时间范围 (0 到 3600秒，即1小时)
    if (duration < 0 || duration > 3600) {
      throw new Error('Duration must be between 0 and 3600 seconds')
    }

    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    if (!today) throw new Error('Failed to generate date string')
    const key = StorageKeys.userStats(session.user.id, today)

    const existingStats = await getStorageItem<UserStats>(key)

    const stats: UserStats = existingStats || {
      userId: session.user.id,
      date: today,
      rotationCount: 0,
      totalDuration: 0,
      records: [],
    }

    const record: RotationRecord = {
      timestamp: Date.now(),
      angle,
      duration,
    }

    stats.rotationCount += 1
    stats.totalDuration += duration
    stats.records.push(record)

    // 只保留最近 100 条记录以控制存储大小
    if (stats.records.length > 100) {
      stats.records = stats.records.slice(-100)
    }

    // 验证数据
    const validatedStats = validateOrThrow(UserStatsSchema, stats)

    // 保留 90 天
    await setStorageItem(key, validatedStats, 60 * 60 * 24 * 90)

    return validatedStats
  } catch (error) {
    logError(error, {
      action: 'recordRotation',
      duration,
    })
    return {
      error: 'INTERNAL_ERROR',
      details: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * 获取统计数据
 * 需求: 8.2 - 读取并渲染每日、每周和每月的运动次数
 * 包含速率限制和输入验证
 */
export async function getStats(startDate: string, endDate: string) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      throw new AuthError('Please sign in to view statistics')
    }

    // 速率限制：防止滥用
    const rateLimitResult = await rateLimitByUser(session.user.id, {
      ...RateLimitTiers.STANDARD,
    })

    if (!rateLimitResult.success) {
      throw new Error('Too many requests. Please try again later.')
    }

    // 验证日期格式
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      throw new Error('Invalid date format. Use YYYY-MM-DD')
    }

    const stats: UserStats[] = []
    const start = new Date(startDate)
    const end = new Date(endDate)

    // 限制查询范围不超过1年
    const daysDiff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    if (daysDiff > 365) {
      throw new Error('Date range cannot exceed 365 days')
    }

    if (start > end) {
      throw new Error('Start date must be before end date')
    }

    // 批量获取所有日期的数据（用 MGET 替代逐日循环，避免 N+1）
    const dateKeys: string[] = []
    const dateStrings: string[] = []
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]
      if (!dateStr) continue
      dateStrings.push(dateStr)
      dateKeys.push(StorageKeys.userStats(session.user.id, dateStr))
    }

    const rawResults = await getMultipleStorageItems(dateKeys)

    rawResults.forEach((raw, index) => {
      if (raw) {
        try {
          stats.push(validateOrThrow(UserStatsSchema, raw))
        } catch (error) {
          logError(error, {
            action: 'getStats',
            date: dateStrings[index],
          })
        }
      }
    })

    return stats
  } catch (error) {
    logError(error, {
      action: 'getStats',
      startDate,
      endDate,
    })
    throw error
  }
}

/**
 * 获取今日统计
 * 需求: 8.2 - 显示今日运动数据
 */
export async function getTodayStats() {
  const today = new Date().toISOString().split('T')[0]
  if (!today) return null
  const stats = await getStats(today, today)
  return stats[0] || null
}

/**
 * 获取本周统计
 * 需求: 8.2 - 显示本周运动数据
 */
export async function getWeekStats() {
  const today = new Date()
  const weekAgo = new Date(today)
  weekAgo.setDate(today.getDate() - 6) // 包括今天共7天

  const startDate = weekAgo.toISOString().split('T')[0]
  const endDate = today.toISOString().split('T')[0]

  if (!startDate || !endDate) {
    throw new Error('Failed to generate date strings')
  }

  return await getStats(startDate, endDate)
}

/**
 * 获取本月统计
 * 需求: 8.2 - 显示本月运动数据
 */
export async function getMonthStats() {
  const today = new Date()
  const monthAgo = new Date(today)
  monthAgo.setDate(today.getDate() - 29) // 包括今天共30天

  const startDate = monthAgo.toISOString().split('T')[0]
  const endDate = today.toISOString().split('T')[0]

  if (!startDate || !endDate) {
    throw new Error('Failed to generate date strings')
  }

  return await getStats(startDate, endDate)
}

/**
 * 获取汇总统计数据
 * 需求: 8.2, 8.5 - 提供可视化图表所需的汇总数据
 */
export async function getSummaryStats() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      throw new AuthError('Please sign in to view statistics')
    }

    const [todayStats, weekStats, monthStats] = await Promise.all([
      getTodayStats().catch(() => null),
      getWeekStats().catch(() => []),
      getMonthStats().catch(() => []),
    ])

    // 计算汇总数据
    const weekTotal = weekStats.reduce(
      (acc, stat) => ({
        count: acc.count + stat.rotationCount,
        duration: acc.duration + stat.totalDuration,
      }),
      { count: 0, duration: 0 }
    )

    const monthTotal = monthStats.reduce(
      (acc, stat) => ({
        count: acc.count + stat.rotationCount,
        duration: acc.duration + stat.totalDuration,
      }),
      { count: 0, duration: 0 }
    )

    return {
      today: {
        count: todayStats?.rotationCount || 0,
        duration: todayStats?.totalDuration || 0,
      },
      week: weekTotal,
      month: monthTotal,
      dailyData: weekStats.map((stat) => ({
        date: stat.date,
        count: stat.rotationCount,
        duration: stat.totalDuration,
      })),
      monthlyData: monthStats.map((stat) => ({
        date: stat.date,
        count: stat.rotationCount,
        duration: stat.totalDuration,
      })),
    }
  } catch (error) {
    logError(error, {
      action: 'getSummaryStats',
    })
    throw error
  }
}

/**
 * 检查是否需要发送健康提醒
 * 需求: 8.3 - 连续2小时未运动时发送提醒
 */
export async function checkHealthReminder() {
  const session = await auth()

  if (!session?.user?.id) {
    return { shouldRemind: false, lastRotationTime: null }
  }

  const todayStats = await getTodayStats()

  // 如果今天没有任何记录，不提醒（新用户或新的一天）
  if (!todayStats || todayStats.records.length === 0) {
    return { shouldRemind: false, lastRotationTime: null }
  }

  // 获取最后一次旋转时间
  const lastRecord = todayStats.records[todayStats.records.length - 1]
  if (!lastRecord) return { shouldRemind: false, lastRotationTime: null }

  const lastRotationTime = lastRecord.timestamp
  const now = Date.now()
  const twoHoursInMs = 2 * 60 * 60 * 1000

  const shouldRemind = now - lastRotationTime > twoHoursInMs

  return { shouldRemind, lastRotationTime }
}

/**
 * 检查是否达到每日目标
 * 需求: 8.4 - 达到每日目标时显示鼓励消息
 */
export async function checkDailyGoal(dailyGoal: number) {
  const todayStats = await getTodayStats()

  if (!todayStats) {
    return {
      achieved: false,
      current: 0,
      goal: dailyGoal,
      progress: 0,
    }
  }

  const achieved = todayStats.rotationCount >= dailyGoal
  const progress = Math.min((todayStats.rotationCount / dailyGoal) * 100, 100)

  return {
    achieved,
    current: todayStats.rotationCount,
    goal: dailyGoal,
    progress,
  }
}
