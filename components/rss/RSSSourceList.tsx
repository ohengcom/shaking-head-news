'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, GripVertical, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { deleteRSSSource, reorderRSSSources, updateRSSSource } from '@/lib/actions/rss'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { RSSSource } from '@/types/rss'

interface RSSSourceListProps {
  initialSources: RSSSource[]
}

export function RSSSourceList({ initialSources }: RSSSourceListProps) {
  const [sources, setSources] = useState<RSSSource[]>(initialSources)
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const { toast } = useToast()
  const t = useTranslations('rss')

  useEffect(() => {
    setSources(initialSources)
  }, [initialSources])

  const handleToggleEnabled = async (id: string, enabled: boolean) => {
    try {
      const updated = await updateRSSSource(id, { enabled })
      setSources(sources.map((s) => (s.id === id ? updated : s)))
      toast({
        title: t('success'),
        description: enabled ? t('sourceEnabled') : t('sourceDisabled'),
      })
    } catch {
      toast({
        title: t('error'),
        description: t('updateFailed'),
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirmDelete'))) return

    try {
      await deleteRSSSource(id)
      setSources(sources.filter((s) => s.id !== id))
      toast({
        title: t('success'),
        description: t('sourceDeleted'),
      })
    } catch {
      toast({
        title: t('error'),
        description: t('deleteFailed'),
        variant: 'destructive',
      })
    }
  }

  const handleDragStart = (id: string) => {
    setDraggedItem(id)
  }

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()

    if (!draggedItem || draggedItem === targetId) return

    const draggedIndex = sources.findIndex((s) => s.id === draggedItem)
    const targetIndex = sources.findIndex((s) => s.id === targetId)

    if (draggedIndex === -1 || targetIndex === -1) return

    const newSources = [...sources]
    const [removed] = newSources.splice(draggedIndex, 1)
    if (removed) {
      newSources.splice(targetIndex, 0, removed)
      setSources(newSources)
    }
  }

  const handleDragEnd = async () => {
    if (!draggedItem) return

    try {
      const sourceIds = sources.map((s) => s.id)
      await reorderRSSSources(sourceIds)
      toast({
        title: t('success'),
        description: t('orderUpdated'),
      })
    } catch {
      toast({
        title: t('error'),
        description: t('reorderFailed'),
        variant: 'destructive',
      })
      setSources(initialSources)
    } finally {
      setDraggedItem(null)
    }
  }

  if (sources.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center">{t('noSources')}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {sources.map((source) => (
        <Card
          key={source.id}
          draggable
          onDragStart={() => handleDragStart(source.id)}
          onDragOver={(e) => handleDragOver(e, source.id)}
          onDragEnd={handleDragEnd}
          className={`cursor-move transition-opacity ${
            draggedItem === source.id ? 'opacity-50' : ''
          }`}
        >
          <CardContent className="px-4 py-4">
            <div className="flex items-start gap-3">
              <GripVertical className="text-muted-foreground mt-1 h-4 w-4 shrink-0" />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base leading-tight font-semibold break-all">{source.name}</h3>
                  {source.failureCount > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertCircle className="mr-1 h-3 w-3" />
                      {source.failureCount} {t('failures')}
                    </Badge>
                  )}
                </div>

                <p className="text-muted-foreground mt-1 text-sm break-all">{source.url}</p>

                {source.description && source.description !== source.url && (
                  <p className="text-muted-foreground/80 mt-1 text-xs">{source.description}</p>
                )}

                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline">{source.language === 'zh' ? '中文' : 'English'}</Badge>
                  {source.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {source.lastFetchedAt && (
                    <span className="text-muted-foreground text-xs">
                      {t('lastFetched')}: {new Date(source.lastFetchedAt).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1 self-center">
                <Switch
                  checked={source.enabled}
                  onCheckedChange={(checked) => handleToggleEnabled(source.id, checked)}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(source.id)}
                  className="text-destructive hover:text-destructive h-8 w-8"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
