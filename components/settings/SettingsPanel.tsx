'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { updateSettings, resetSettings } from '@/lib/actions/settings'
import { useToast } from '@/hooks/use-toast'
import { UserSettings, defaultSettings } from '@/types/settings'
import { Loader2, RotateCcw, Lock, Sparkles } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { LanguageSelector } from './LanguageSelector'
import { useUIStore } from '@/lib/stores/ui-store'
import { useRotationStore } from '@/lib/stores/rotation-store'
import { useTheme } from 'next-themes'
import { useUserTier } from '@/hooks/use-user-tier'
import { UpgradePrompt } from '@/components/tier/UpgradePrompt'

import { HOT_LIST_SOURCES } from '@/lib/constants/hot-list-sources'
import { Reorder, AnimatePresence, motion } from 'framer-motion'
import { Plus, X, GripVertical, Check } from 'lucide-react'

interface SettingsPanelProps {
  initialSettings: UserSettings
}

/**
 * 锁定设置项组件
 */
function LockedSettingItem({
  label,
  description,
  value,
  requiredTier = 'member',
}: {
  label: string
  description?: string
  value: string
  requiredTier?: 'member' | 'pro'
}) {
  const t = useTranslations('tier')

  return (
    <div className="space-y-2 opacity-60">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          {label}
          <Lock className="text-muted-foreground h-3 w-3" />
        </Label>
        <span className="text-muted-foreground text-sm">{value}</span>
      </div>
      {description && <p className="text-muted-foreground text-sm">{description}</p>}
      <p className="text-muted-foreground text-xs">
        {requiredTier === 'member' ? t('loginToUnlock') : t('upgradeToUnlock')}
      </p>
    </div>
  )
}

function SaveButton({
  label,
  isPending,
  disabled,
}: {
  label: string
  isPending: boolean
  disabled?: boolean
}) {
  return (
    <Button type="submit" disabled={disabled ?? isPending} className="flex-1">
      {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {label}
    </Button>
  )
}

function ResetButton({
  label,
  onClick,
  isPending,
  disabled,
}: {
  label: string
  onClick: () => void
  isPending: boolean
  disabled?: boolean
}) {
  return (
    <Button type="button" onClick={onClick} disabled={disabled ?? isPending} variant="outline">
      {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {!isPending && <RotateCcw className="mr-2 h-4 w-4" />}
      {label}
    </Button>
  )
}

export function SettingsPanel({ initialSettings }: SettingsPanelProps) {
  const [settings, setSettings] = useState<UserSettings>(initialSettings)
  const { toast } = useToast()
  const t = useTranslations('settings')
  const tTier = useTranslations('tier')
  const tFeatures = useTranslations('features')
  const tCommon = useTranslations('common')
  const { setFontSize, setLayoutMode } = useUIStore()
  const {
    setMode: setRotationMode,
    setInterval: setRotationInterval,
    togglePause,
    isPaused,
  } = useRotationStore()
  const { setTheme } = useTheme()
  const { isGuest, isPro, features, togglePro, isTogglingPro } = useUserTier()

  const [isSaving, setIsSaving] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  // Sync UI store, rotation store, and theme with settings on mount and when settings change
  useEffect(() => {
    setFontSize(settings.fontSize)
    setLayoutMode(settings.layoutMode)
    setTheme(settings.theme)
    setRotationMode(settings.rotationMode)
    setRotationInterval(settings.rotationInterval)
  }, [
    settings.fontSize,
    settings.layoutMode,
    settings.theme,
    settings.rotationMode,
    settings.rotationInterval,
    setFontSize,
    setLayoutMode,
    setTheme,
    setRotationMode,
    setRotationInterval,
  ])

  const handleSaveAction = async () => {
    setIsSaving(true)
    try {
      const result = await updateSettings(settings)

      if (result.success && result.settings) {
        setSettings(result.settings)
        toast({
          title: t('saveSuccess'),
          description: t('saveSuccessDescription'),
        })
      } else {
        toast({
          title: t('saveError'),
          description: result.error || t('saveErrorDescription'),
          variant: 'destructive',
        })
      }
    } catch {
      toast({
        title: t('saveError'),
        description: t('saveErrorDescription'),
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleResetAction = async () => {
    setIsResetting(true)
    try {
      const result = await resetSettings()

      if (result.success && result.settings) {
        setSettings(result.settings)
        toast({
          title: t('saveSuccess'),
          description: t('saveSuccessDescription'),
        })
      } else {
        toast({
          title: t('saveError'),
          description: result.error || t('saveErrorDescription'),
          variant: 'destructive',
        })
      }
    } catch {
      toast({
        title: t('saveError'),
        description: t('saveErrorDescription'),
        variant: 'destructive',
      })
    } finally {
      setIsResetting(false)
    }
  }

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }))

    // Update UI store, rotation store, and theme immediately for instant visual feedback
    if (key === 'fontSize') {
      setFontSize(value as UserSettings['fontSize'])
    } else if (key === 'layoutMode') {
      setLayoutMode(value as UserSettings['layoutMode'])
    } else if (key === 'theme') {
      setTheme(value as string)
    } else if (key === 'rotationMode') {
      setRotationMode(value as 'fixed' | 'continuous')
    } else if (key === 'rotationInterval') {
      setRotationInterval(value as number)
    }
  }

  return (
    <div className="space-y-6">
      {/* 语言和主题设置 */}
      <Card>
        <CardHeader>
          <CardTitle>{t('theme')}</CardTitle>
          <CardDescription>{t('themeDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <LanguageSelector currentLanguage={settings.language} />

          <div className="space-y-2">
            <Label htmlFor="theme">{t('theme')}</Label>
            <Select
              value={settings.theme}
              onValueChange={(value) =>
                updateSetting('theme', value as 'light' | 'dark' | 'system')
              }
            >
              <SelectTrigger id="theme">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">{t('light')}</SelectItem>
                <SelectItem value="dark">{t('dark')}</SelectItem>
                <SelectItem value="system">{t('system')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 字体大小 - Guest 锁定 */}
          {features.fontSizeAdjustable ? (
            <div className="space-y-2">
              <Label htmlFor="fontSize">{t('fontSize')}</Label>
              <Select
                value={settings.fontSize}
                onValueChange={(value) =>
                  updateSetting('fontSize', value as UserSettings['fontSize'])
                }
              >
                <SelectTrigger id="fontSize">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">{t('small')}</SelectItem>
                  <SelectItem value="medium">{t('medium')}</SelectItem>
                  <SelectItem value="large">{t('large')}</SelectItem>
                  <SelectItem value="xlarge">{t('xlarge')}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-sm">{t('fontSizeDescription')}</p>
            </div>
          ) : (
            <LockedSettingItem
              label={t('fontSize')}
              description={t('fontSizeDescription')}
              value={t('medium')}
              requiredTier="member"
            />
          )}

          {/* 布局模式 - Guest 锁定 */}
          {features.layoutModeSelectable ? (
            <div className="space-y-2">
              <Label htmlFor="layoutMode">{t('layout')}</Label>
              <Select
                value={settings.layoutMode}
                onValueChange={(value) =>
                  updateSetting('layoutMode', value as 'normal' | 'compact')
                }
              >
                <SelectTrigger id="layoutMode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">{t('normal')}</SelectItem>
                  <SelectItem value="compact">{t('compact')}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-sm">{t('layoutDescription')}</p>
            </div>
          ) : (
            <LockedSettingItem
              label={t('layout')}
              description={t('layoutDescription')}
              value={t('normal')}
              requiredTier="member"
            />
          )}
        </CardContent>
      </Card>

      {/* 旋转设置 */}
      <Card>
        <CardHeader>
          <CardTitle>{t('rotation')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 旋转模式 - Guest 锁定 */}
          {features.rotationModeSelectable ? (
            <div className="space-y-2">
              <Label htmlFor="rotationMode">{t('rotationMode')}</Label>
              <Select
                value={settings.rotationMode}
                onValueChange={(value) =>
                  updateSetting('rotationMode', value as 'fixed' | 'continuous')
                }
              >
                <SelectTrigger id="rotationMode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">{t('fixed')}</SelectItem>
                  <SelectItem value="continuous">{t('continuous')}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-sm">{t('rotationModeDescription')}</p>
            </div>
          ) : (
            <LockedSettingItem
              label={t('rotationMode')}
              description={t('rotationModeDescription')}
              value={t('continuous')}
              requiredTier="member"
            />
          )}

          {/* 旋转间隔 - Guest 锁定 */}
          {features.rotationIntervalAdjustable ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="rotationInterval">{t('interval')}</Label>
                <span className="text-muted-foreground text-sm">{settings.rotationInterval}s</span>
              </div>
              <Slider
                id="rotationInterval"
                value={[settings.rotationInterval]}
                onValueChange={([value]) => {
                  if (value !== undefined) updateSetting('rotationInterval', value)
                }}
                min={5}
                max={60}
                step={5}
                className="w-full"
              />
              <p className="text-muted-foreground text-sm">{t('intervalDescription')}</p>
            </div>
          ) : (
            <LockedSettingItem
              label={t('interval')}
              description={t('intervalDescription')}
              value={`${defaultSettings.rotationInterval}s`}
              requiredTier="member"
            />
          )}

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="animationEnabled">{t('animation')}</Label>
              <p className="text-muted-foreground text-sm">{t('animationDescription')}</p>
            </div>
            <Switch
              id="animationEnabled"
              checked={!isPaused}
              onCheckedChange={(checked) => {
                updateSetting('animationEnabled', checked)
                // Sync with rotation store
                if (checked === isPaused) {
                  togglePause()
                }
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Guest 用户升级提示 */}
      {isGuest && <UpgradePrompt variant="inline" className="my-4" />}

      {/* 新闻内容设置 - 所有会员可见 */}
      {!isGuest && (
        <Card>
          <CardHeader>
            <CardTitle>新闻内容</CardTitle>
            <CardDescription>选择您感兴趣的新闻来源</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Unenabled Sources (Left Column) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                    待添加 (
                    {HOT_LIST_SOURCES.filter((s) => !settings.newsSources?.includes(s.id)).length})
                  </Label>
                </div>
                <div className="bg-muted/30 min-h-[300px] rounded-lg border p-2">
                  <div className="space-y-2">
                    {HOT_LIST_SOURCES.filter(
                      (source) => !settings.newsSources?.includes(source.id)
                    ).map((source) => (
                      <motion.div
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        key={source.id}
                        className="bg-card hover:border-primary/50 group flex cursor-pointer items-center justify-between rounded-md border p-2 text-sm transition-colors"
                        onClick={() => {
                          const currentSources = settings.newsSources || []
                          updateSetting('newsSources', [...currentSources, source.id])
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{source.icon}</span>
                          <span>{source.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    ))}
                    {HOT_LIST_SOURCES.filter((s) => !settings.newsSources?.includes(s.id))
                      .length === 0 && (
                      <div className="text-muted-foreground flex h-full flex-col items-center justify-center py-8 text-xs">
                        <Check className="mb-2 h-8 w-8 opacity-20" />
                        已全部添加
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Enabled Sources (Right Column - Sortable) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-primary text-xs font-medium tracking-wider uppercase">
                    已启用 ({settings.newsSources?.length || 0}) - 可拖拽排序
                  </Label>
                </div>
                <div className="bg-card min-h-[300px] rounded-lg border p-2">
                  <Reorder.Group
                    axis="y"
                    values={settings.newsSources || []}
                    onReorder={(newOrder) => updateSetting('newsSources', newOrder)}
                    className="space-y-2"
                  >
                    <AnimatePresence initial={false}>
                      {(settings.newsSources || []).map((sourceId) => {
                        const source = HOT_LIST_SOURCES.find((s) => s.id === sourceId)
                        if (!source) return null
                        return (
                          <Reorder.Item
                            key={source.id}
                            value={source.id}
                            className="bg-background flex cursor-grab items-center justify-between rounded-md border p-2 text-sm shadow-sm active:cursor-grabbing"
                            whileDrag={{
                              scale: 1.02,
                              zIndex: 10,
                              boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <GripVertical className="text-muted-foreground/50 h-4 w-4" />
                              <span className="text-lg">{source.icon}</span>
                              <span className="font-medium">{source.name}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-destructive h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation() // Prevent triggering drag or other events
                                const currentSources = settings.newsSources || []
                                updateSetting(
                                  'newsSources',
                                  currentSources.filter((id) => id !== source.id)
                                )
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </Reorder.Item>
                        )
                      })}
                    </AnimatePresence>
                    {(settings.newsSources?.length || 0) === 0 && (
                      <div className="text-muted-foreground flex h-full flex-col items-center justify-center py-8 text-xs">
                        请从左侧添加新闻源
                      </div>
                    )}
                  </Reorder.Group>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!isGuest && (
        <Card>
          <CardHeader>
            <CardTitle>{isPro ? tTier('pro') : tTier('member')}</CardTitle>
            <CardDescription>
              {isPro ? tFeatures('proCurrentMessage') : tFeatures('memberCurrentMessage')}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {!isGuest && (
        <Card className={isPro ? 'border-amber-500/40 bg-amber-50/40 dark:bg-amber-950/10' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              {isPro ? 'Pro 已激活' : 'Pro 功能'}
            </CardTitle>
            <CardDescription>
              {isPro
                ? tFeatures('proCurrentMessage')
                : '一键激活 Pro，解锁自定义 RSS、完整统计、健康提醒和去广告等能力。'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={togglePro}
              disabled={isTogglingPro}
              className="bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600"
            >
              {isTogglingPro ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              {isPro ? `${tCommon('cancel')} ${tTier('pro')}` : tFeatures('oneClickActivateButton')}
            </Button>
          </CardContent>
        </Card>
      )}

      {isPro && (
        <Card>
          <CardHeader>
            <CardTitle>{t('newsSource') || '自定义订阅'}</CardTitle>
            <CardDescription>
              {t('newsSourceDescription') || '管理您的自定义 RSS 新闻源'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {features.customRssEnabled ? (
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>RSS 订阅管理</Label>
                  <p className="text-muted-foreground text-sm">添加或移除自定义 RSS 新闻源</p>
                </div>
                <Button variant="outline" asChild>
                  <a href="/rss">管理订阅</a>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between opacity-60">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      RSS 订阅管理
                      <Lock className="text-muted-foreground h-3 w-3" />
                    </Label>
                    <p className="text-muted-foreground text-sm">添加或移除自定义 RSS 新闻源</p>
                  </div>
                  <Button variant="outline" disabled>
                    管理订阅
                  </Button>
                </div>
                <p className="text-muted-foreground text-xs">{tTier('upgradeToUnlock')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {features.adsDisableable && (
        <Card>
          <CardHeader>
            <CardTitle>广告设置</CardTitle>
            <CardDescription>管理广告显示偏好</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="adsEnabled">显示广告</Label>
                <p className="text-muted-foreground text-sm">关闭后将不再显示广告</p>
              </div>
              <Switch
                id="adsEnabled"
                checked={settings.adsEnabled}
                onCheckedChange={(checked) => updateSetting('adsEnabled', checked)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* 健康提醒设置 - Pro 功能 */}
      {isPro && (
        <Card>
          <CardHeader>
            <CardTitle>{t('notifications')}</CardTitle>
            <CardDescription>{t('dailyGoalDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 每日目标 - Pro 功能 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="dailyGoal">{t('dailyGoal')}</Label>
                <span className="text-muted-foreground text-sm">{settings.dailyGoal}</span>
              </div>
              <Slider
                id="dailyGoal"
                value={[settings.dailyGoal]}
                onValueChange={([value]) => {
                  if (value !== undefined) updateSetting('dailyGoal', value)
                }}
                min={10}
                max={100}
                step={5}
                className="w-full"
              />
              <p className="text-muted-foreground text-sm">{t('dailyGoalDescription')}</p>
            </div>

            {/* 健康提醒 - Pro 功能 */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notificationsEnabled">{t('notifications')}</Label>
                <p className="text-muted-foreground text-sm">{t('notificationsDescription')}</p>
              </div>
              <Switch
                id="notificationsEnabled"
                checked={settings.notificationsEnabled}
                onCheckedChange={(checked) => updateSetting('notificationsEnabled', checked)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* 操作按钮 - 仅登录用户可保存 */}
      {!isGuest ? (
        <form
          onSubmit={(event) => {
            event.preventDefault()
            void handleSaveAction()
          }}
          className="flex gap-4"
        >
          <SaveButton label="保存" isPending={isSaving} disabled={isSaving || isResetting} />
          <ResetButton
            label="重置"
            onClick={handleResetAction}
            isPending={isResetting}
            disabled={isSaving || isResetting}
          />
        </form>
      ) : (
        <div className="border-muted-foreground/30 bg-muted/30 rounded-lg border border-dashed p-4 text-center">
          <p className="text-muted-foreground text-sm">{tTier('loginToUnlockDescription')}</p>
        </div>
      )}
    </div>
  )
}
