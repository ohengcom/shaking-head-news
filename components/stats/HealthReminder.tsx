'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Bell, BellOff, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { checkHealthReminder } from '@/lib/actions/stats'

interface HealthReminderProps {
  dailyGoal: number
  currentCount: number
  notificationsEnabled: boolean
}

/**
 * 健康提醒组件
 * 需求: 8.3 - 连续2小时未运动时使用浏览器 Notification API 发送提醒
 * 需求: 8.4 - 达到每日目标时使用 Toast 显示鼓励消息
 */
export function HealthReminder({
  dailyGoal,
  currentCount,
  notificationsEnabled: settingsEnabled,
}: HealthReminderProps) {
  const t = useTranslations('stats')
  const { toast } = useToast()
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [permission, setPermission] = useState<'default' | 'granted' | 'denied'>('default')
  const [goalAchieved, setGoalAchieved] = useState(false)

  // 检查通知权限
  useEffect(() => {
    if (!settingsEnabled) {
      setNotificationsEnabled(false)
      return
    }

    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission)
      setNotificationsEnabled(Notification.permission === 'granted')
    }
  }, [settingsEnabled])

  // 检查是否达到目标
  useEffect(() => {
    if (currentCount >= dailyGoal && !goalAchieved) {
      setGoalAchieved(true)
      // 需求 8.4: 达到目标时显示鼓励消息
      toast({
        title: t('goalAchieved'),
        description: t('goalAchievedMessage', { count: currentCount }),
        duration: 5000,
      })
    } else if (currentCount < dailyGoal && goalAchieved) {
      setGoalAchieved(false)
    }
  }, [currentCount, dailyGoal, goalAchieved, t, toast])

  // 定期检查是否需要发送健康提醒
  useEffect(() => {
    if (!settingsEnabled || !notificationsEnabled) return

    const checkReminder = async () => {
      try {
        const { shouldRemind } = await checkHealthReminder()

        // 需求 8.3: 连续2小时未运动时发送提醒
        if (shouldRemind) {
          sendNotification()
        }
      } catch (error) {
        console.error('Failed to check health reminder:', error)
      }
    }

    // 每30分钟检查一次
    const interval = setInterval(checkReminder, 30 * 60 * 1000)

    // 不立即检查，等待第一个间隔

    return () => clearInterval(interval)
  }, [notificationsEnabled, settingsEnabled])

  // 请求通知权限
  const requestNotificationPermission = async () => {
    if (!settingsEnabled) {
      toast({
        title: t('notificationDisabled'),
        description: t('notificationDisabledMessage'),
        variant: 'destructive',
      })
      return
    }

    if (typeof window === 'undefined' || !('Notification' in window)) {
      toast({
        title: t('notificationNotSupported'),
        description: t('notificationNotSupportedMessage'),
        variant: 'destructive',
      })
      return
    }

    try {
      const permission = await Notification.requestPermission()
      setPermission(permission)
      setNotificationsEnabled(permission === 'granted')

      if (permission === 'granted') {
        toast({
          title: t('notificationEnabled'),
          description: t('notificationEnabledMessage'),
        })
      } else {
        toast({
          title: t('notificationDenied'),
          description: t('notificationDeniedMessage'),
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Failed to request notification permission:', error)
    }
  }

  // 发送通知
  const sendNotification = () => {
    if (!notificationsEnabled || permission !== 'granted') return
    if (typeof window === 'undefined') return

    try {
      const notification = new Notification(t('healthReminderTitle'), {
        body: t('healthReminderBody'),
        icon: '/favicon.png',
        badge: '/favicon.png',
        tag: 'health-reminder',
        requireInteraction: false,
        silent: false,
      })

      notification.onclick = () => {
        window.focus()
        notification.close()
      }

      // 10秒后自动关闭
      setTimeout(() => notification.close(), 10000)
    } catch (error) {
      console.error('Failed to send notification:', error)
    }
  }

  // 禁用通知
  const disableNotifications = () => {
    setNotificationsEnabled(false)
    toast({
      title: t('notificationDisabled'),
      description: t('notificationDisabledMessage'),
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{t('healthReminder')}</span>
          {goalAchieved && <CheckCircle2 className="h-5 w-5 text-green-500" />}
        </CardTitle>
        <CardDescription>{t('healthReminderDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {notificationsEnabled ? t('notificationsOn') : t('notificationsOff')}
            </p>
            <p className="text-muted-foreground text-xs">
              {notificationsEnabled
                ? t('notificationsOnDescription')
                : t('notificationsOffDescription')}
            </p>
          </div>
          <div>
            {!notificationsEnabled ? (
              <Button
                onClick={requestNotificationPermission}
                variant="outline"
                size="sm"
                disabled={!settingsEnabled}
              >
                <Bell className="mr-2 h-4 w-4" />
                {t('enableNotifications')}
              </Button>
            ) : (
              <Button onClick={disableNotifications} variant="outline" size="sm">
                <BellOff className="mr-2 h-4 w-4" />
                {t('disableNotifications')}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
