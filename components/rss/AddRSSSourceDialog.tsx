'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { addRSSSource } from '@/lib/actions/rss'
import { Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'

export function AddRSSSourceDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    language: 'zh' as 'zh' | 'en',
    enabled: true,
    tags: '',
  })
  const { toast } = useToast()
  const t = useTranslations('rss')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 验证必填字段
      if (!formData.url.trim()) {
        toast({
          title: t('error'),
          description: t('requiredFields'),
          variant: 'destructive',
        })
        setLoading(false)
        return
      }

      // Validate URL format
      try {
        new URL(formData.url)
      } catch {
        toast({
          title: t('error'),
          description: t('invalidUrl'),
          variant: 'destructive',
        })
        setLoading(false)
        return
      }

      // 解析标签
      const tags = formData.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)

      const result = await addRSSSource({
        name: formData.name.trim(),
        url: formData.url.trim(),
        description: formData.description.trim() || undefined,
        language: formData.language,
        enabled: formData.enabled,
        tags,
      })

      if (!result.success) {
        toast({
          title: t('error'),
          description: t(result.errorCode),
          variant: 'destructive',
        })
        return
      }

      toast({
        title: t('success'),
        description: t('sourceAdded'),
      })

      // 重置表单
      setFormData({
        name: '',
        url: '',
        description: '',
        language: 'zh',
        enabled: true,
        tags: '',
      })
      setOpen(false)
      router.refresh()
    } catch (error) {
      toast({
        title: t('error'),
        description: error instanceof Error ? error.message : t('addFailed'),
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          {t('addSource')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t('addSource')}</DialogTitle>
            <DialogDescription>{t('addSourceDescription')}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">{t('sourceName')}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('sourceNamePlaceholder')}
              />
              <p className="text-muted-foreground text-xs">{t('sourceNameHint')}</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="url">
                {t('sourceUrl')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="url"
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://example.com or https://example.com/feed.xml"
                required
              />
              <p className="text-muted-foreground text-xs">{t('sourceUrlHint')}</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">{t('sourceDescription')}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('sourceDescriptionPlaceholder')}
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="language">{t('sourceLanguage')}</Label>
              <Select
                value={formData.language}
                onValueChange={(value: 'zh' | 'en') =>
                  setFormData({ ...formData, language: value })
                }
              >
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="zh">中文</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tags">{t('sourceTags')}</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder={t('sourceTagsPlaceholder')}
              />
              <p className="text-muted-foreground text-xs">{t('sourceTagsHint')}</p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t('adding') : t('add')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
