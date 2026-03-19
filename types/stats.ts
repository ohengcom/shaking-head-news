import { z } from 'zod'

export const RotationRecordSchema = z.object({
  timestamp: z.number(),
  angle: z.number(),
  duration: z.number(), // 持续时间（秒）
  count: z.number().int().min(1).max(500).optional(),
})

export type RotationRecord = z.infer<typeof RotationRecordSchema>

export const UserStatsSchema = z.object({
  userId: z.string(),
  date: z.string(), // YYYY-MM-DD
  rotationCount: z.number(),
  totalDuration: z.number(), // 总时长（秒）
  records: z.array(RotationRecordSchema),
})

export type UserStats = z.infer<typeof UserStatsSchema>
