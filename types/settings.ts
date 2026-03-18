import { z } from 'zod'

export const UserSettingsSchema = z.object({
  userId: z.string(),
  language: z.enum(['zh', 'en']),
  theme: z.enum(['light', 'dark', 'system']),
  rotationMode: z.enum(['fixed', 'continuous']),
  rotationInterval: z.number().min(5).max(60),
  animationEnabled: z.boolean(),
  fontSize: z.enum(['small', 'medium', 'large', 'xlarge']),
  layoutMode: z.enum(['normal', 'compact']),
  dailyGoal: z.number().min(10).max(100),
  notificationsEnabled: z.boolean(),
  adsEnabled: z.boolean(),
  newsSources: z.array(z.string()),
  activeSource: z.string().optional(),
})

export type UserSettings = z.infer<typeof UserSettingsSchema>

export const defaultSettings: Omit<UserSettings, 'userId'> = {
  language: 'zh',
  theme: 'system',
  rotationMode: 'continuous',
  rotationInterval: 10,
  animationEnabled: true,
  fontSize: 'medium',
  layoutMode: 'normal',
  dailyGoal: 30,
  notificationsEnabled: true,
  adsEnabled: true,
  newsSources: ['everydaynews'],
  activeSource: 'everydaynews',
}
