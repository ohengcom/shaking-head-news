'use client'

import { Globe } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useState, useTransition } from 'react'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { updateSettings } from '@/lib/actions/settings'
import { useToast } from '@/hooks/use-toast'

interface LanguageSelectorProps {
  currentLanguage: 'zh' | 'en'
}

export function LanguageSelector({ currentLanguage }: LanguageSelectorProps) {
  const t = useTranslations('settings')
  const { toast } = useToast()
  const router = useRouter()
  const [language, setLanguage] = useState<'zh' | 'en'>(currentLanguage)
  const [isPending, startTransition] = useTransition()

  const handleLanguageChange = (newLanguage: 'zh' | 'en') => {
    const previousLanguage = language
    setLanguage(newLanguage)

    startTransition(async () => {
      const result = await updateSettings({ language: newLanguage })

      if (result.success) {
        toast({
          title: t('saveSuccess'),
          description: t('saveSuccessDescription'),
        })
        router.refresh()
        return
      }

      toast({
        title: t('saveError'),
        description: result.error || t('saveErrorDescription'),
        variant: 'destructive',
      })
      setLanguage(previousLanguage)
    })
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="language" className="flex items-center gap-2">
        <Globe className="h-4 w-4" />
        {t('language')}
      </Label>
      <Select
        value={language}
        onValueChange={(value) => handleLanguageChange(value as 'zh' | 'en')}
        disabled={isPending}
      >
        <SelectTrigger id="language">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="zh">{t('chinese')}</SelectItem>
          <SelectItem value="en">{t('english')}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
