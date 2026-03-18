/**
 * Feature Configuration System
 * 三层用户模式功能开关配置
 */

export type UserTier = 'guest' | 'member' | 'pro'

export interface FeatureConfig {
  // 旋转设置
  rotationModeSelectable: boolean // 是否可选择旋转模式
  rotationIntervalAdjustable: boolean // 是否可调节旋转间隔
  rotationAngleAdjustable: boolean // 是否可调节旋转角度

  // 显示设置
  fontSizeAdjustable: boolean // 是否可调节字体大小
  layoutModeSelectable: boolean // 是否可选择布局模式

  // 新闻源
  customRssEnabled: boolean // 是否可自定义 RSS
  opmlImportExportEnabled: boolean // 是否支持 OPML 导入/导出

  // 广告
  adsDisableable: boolean // 是否可关闭广告

  // 统计
  statsPreviewEnabled: boolean // 是否显示统计预览（模糊）
  statsFullEnabled: boolean // 是否显示完整统计
  healthRemindersEnabled: boolean // 是否启用健康提醒
  exerciseGoalsEnabled: boolean // 是否启用运动目标

  // 其他
  keyboardShortcutsEnabled: boolean // 是否启用键盘快捷键
  cloudSyncEnabled: boolean // 是否启用云同步
}

/**
 * 访客功能配置
 * 即开即用，无需登录，功能受限
 */
export const GUEST_FEATURES: FeatureConfig = {
  rotationModeSelectable: false,
  rotationIntervalAdjustable: false,
  rotationAngleAdjustable: false,
  fontSizeAdjustable: false,
  layoutModeSelectable: false,
  customRssEnabled: false,
  opmlImportExportEnabled: false,
  adsDisableable: false,
  statsPreviewEnabled: false,
  statsFullEnabled: false,
  healthRemindersEnabled: false,
  exerciseGoalsEnabled: false,
  keyboardShortcutsEnabled: false,
  cloudSyncEnabled: false,
}

/**
 * 会员功能配置
 * 免费登录，解锁高级控制和云同步
 */
export const MEMBER_FEATURES: FeatureConfig = {
  rotationModeSelectable: true,
  rotationIntervalAdjustable: true,
  rotationAngleAdjustable: true,
  fontSizeAdjustable: true,
  layoutModeSelectable: true,
  customRssEnabled: false,
  opmlImportExportEnabled: false,
  adsDisableable: false,
  statsPreviewEnabled: true,
  statsFullEnabled: false,
  healthRemindersEnabled: false,
  exerciseGoalsEnabled: false,
  keyboardShortcutsEnabled: false,
  cloudSyncEnabled: true,
}

/**
 * Pro 功能配置
 * 付费订阅（未来），解锁全部高级功能
 */
export const PRO_FEATURES: FeatureConfig = {
  rotationModeSelectable: true,
  rotationIntervalAdjustable: true,
  rotationAngleAdjustable: true,
  fontSizeAdjustable: true,
  layoutModeSelectable: true,
  customRssEnabled: true,
  opmlImportExportEnabled: true,
  adsDisableable: true,
  statsPreviewEnabled: true,
  statsFullEnabled: true,
  healthRemindersEnabled: true,
  exerciseGoalsEnabled: true,
  keyboardShortcutsEnabled: true,
  cloudSyncEnabled: true,
}

/**
 * 根据用户层级获取功能配置
 */
export function getFeaturesForTier(tier: UserTier): FeatureConfig {
  switch (tier) {
    case 'pro':
      return PRO_FEATURES
    case 'member':
      return MEMBER_FEATURES
    default:
      return GUEST_FEATURES
  }
}

/**
 * 检查特定功能是否对指定层级可用
 */
export function isFeatureEnabled(tier: UserTier, feature: keyof FeatureConfig): boolean {
  return getFeaturesForTier(tier)[feature]
}

/**
 * 获取功能所需的最低层级
 */
export function getRequiredTierForFeature(feature: keyof FeatureConfig): UserTier {
  if (GUEST_FEATURES[feature]) return 'guest'
  if (MEMBER_FEATURES[feature]) return 'member'
  return 'pro'
}
