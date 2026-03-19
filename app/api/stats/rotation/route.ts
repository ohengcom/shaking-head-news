import { z } from 'zod'
import { recordRotation } from '@/lib/actions/stats'

export const maxDuration = 10

const RotationPayloadSchema = z.object({
  angle: z.number(),
  duration: z.number(),
  count: z.number().int().min(1).max(500).optional(),
})

export async function POST(request: Request) {
  try {
    const raw = await request.text()
    if (!raw) {
      return new Response(null, { status: 400 })
    }

    let payload: unknown
    try {
      payload = JSON.parse(raw)
    } catch {
      return new Response(null, { status: 400 })
    }

    const parsed = RotationPayloadSchema.safeParse(payload)
    if (!parsed.success) {
      return new Response(null, { status: 400 })
    }

    await recordRotation(parsed.data.angle, parsed.data.duration, parsed.data.count ?? 1)
    return new Response(null, { status: 204 })
  } catch {
    return new Response(null, { status: 500 })
  }
}
