/**
 * Data Access Layer - Settings
 * 设置数据访问层
 *
 * 在数据访问层进行认证检查
 * 支持云存储回退到 localStorage
 */

import { getCurrentUser } from './auth'
import { getStorageItem, setStorageItem, StorageKeys } from '@/lib/storage'
import { DEFAULT_SETTINGS, UserSettings, clampSettingValue } from '@/lib/config/defaults'

/**
 * 获取用户设置
 * - 未登录用户返回默认设置
 * - 已登录用户从云端加载设置
 */
export async function getUserSettings(): Promise<UserSettings> {
  const user = await getCurrentUser()

  // 未登录用户返回默认设置
  if (!user) {
    return DEFAULT_SETTINGS
  }

  // 已登录用户从云端加载设置
  try {
    const key = StorageKeys.userSettings(user.id)
    const settings = await getStorageItem<Partial<UserSettings>>(key)

    if (settings) {
      // 合并云端设置和默认设置（确保新增字段有默认值）
      return {
        ...DEFAULT_SETTINGS,
        ...settings,
      }
    }

    return DEFAULT_SETTINGS
  } catch (error) {
    console.error('Failed to load user settings from cloud:', error)
    // 云端不可用时返回默认设置
    return DEFAULT_SETTINGS
  }
}

/**
 * 保存用户设置
 * - 需要认证
 * - 自动验证和限制设置值范围
 */
export async function saveUserSettings(settings: Partial<UserSettings>): Promise<void> {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Must be logged in to save settings')
  }

  // 验证和限制数值范围
  const validatedSettings = { ...settings }

  if (typeof validatedSettings.rotationInterval === 'number') {
    validatedSettings.rotationInterval = clampSettingValue(
      'rotationInterval',
      validatedSettings.rotationInterval
    )
  }

  if (typeof validatedSettings.tiltAngle === 'number') {
    validatedSettings.tiltAngle = clampSettingValue('tiltAngle', validatedSettings.tiltAngle)
  }

  if (typeof validatedSettings.dailyGoal === 'number') {
    validatedSettings.dailyGoal = clampSettingValue('dailyGoal', validatedSettings.dailyGoal)
  }

  try {
    const key = StorageKeys.userSettings(user.id)
    const existingSettings = await getStorageItem<Partial<UserSettings>>(key)

    // 合并现有设置和新设置
    const mergedSettings = {
      ...existingSettings,
      ...validatedSettings,
    }

    await setStorageItem(key, mergedSettings)
  } catch (error) {
    console.error('Failed to save user settings:', error)
    throw new Error('Failed to save settings', { cause: error })
  }
}

/**
 * 重置用户设置为默认值
 */
export async function resetUserSettings(): Promise<void> {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Must be logged in to reset settings')
  }

  try {
    const key = StorageKeys.userSettings(user.id)
    await setStorageItem(key, DEFAULT_SETTINGS)
  } catch (error) {
    console.error('Failed to reset user settings:', error)
    throw new Error('Failed to reset settings', { cause: error })
  }
}

/**
 * 获取单个设置值
 */
export async function getSettingValue<K extends keyof UserSettings>(
  key: K
): Promise<UserSettings[K]> {
  const settings = await getUserSettings()
  return settings[key]
}

/**
 * 更新单个设置值
 */
export async function updateSettingValue<K extends keyof UserSettings>(
  key: K,
  value: UserSettings[K]
): Promise<void> {
  await saveUserSettings({ [key]: value } as Partial<UserSettings>)
}
