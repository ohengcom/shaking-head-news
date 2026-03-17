'use client'

import { useRotationStore } from '@/lib/stores/rotation-store'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Pause, Play, RotateCw } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function RotationControls() {
  const { isPaused, mode, interval, togglePause, setMode, setInterval } = useRotationStore()
  const t = useTranslations('rotation')
  const tSettings = useTranslations('settings')

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RotateCw className="h-5 w-5" />
          {t('controls')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pause/Resume Button */}
        <div className="flex items-center justify-between">
          <Label htmlFor="pause-toggle">{isPaused ? t('resume') : t('pause')}</Label>
          <Button
            id="pause-toggle"
            variant="outline"
            size="sm"
            onClick={togglePause}
            className="gap-2"
          >
            {isPaused ? (
              <>
                <Play className="h-4 w-4" />
                {t('resume')}
              </>
            ) : (
              <>
                <Pause className="h-4 w-4" />
                {t('pause')}
              </>
            )}
          </Button>
        </div>

        {/* Rotation Mode */}
        <div className="space-y-2">
          <Label>{tSettings('rotationMode')}</Label>
          <div className="flex gap-2">
            <Button
              variant={mode === 'fixed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('fixed')}
              className="flex-1"
            >
              {tSettings('fixed')}
            </Button>
            <Button
              variant={mode === 'continuous' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('continuous')}
              className="flex-1"
            >
              {tSettings('continuous')}
            </Button>
          </div>
        </div>

        {/* Rotation Interval (only for continuous mode) */}
        {mode === 'continuous' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="interval-slider">{tSettings('interval')}</Label>
              <span className="text-muted-foreground text-sm">{interval}s</span>
            </div>
            <Slider
              id="interval-slider"
              value={[interval]}
              onValueChange={([value]) => {
                if (value !== undefined) setInterval(value)
              }}
              min={5}
              max={300}
              step={5}
              className="w-full"
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
