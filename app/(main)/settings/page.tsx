import { getUserSettings } from '@/lib/actions/settings'
import { SettingsPanel } from '@/components/settings/SettingsPanel'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const maxDuration = 10

export const metadata = {
  title: '设置 - 摇头看新闻',
  description: '自定义您的阅读体验和偏好设置',
}

export default async function SettingsPage() {
  const session = await auth()

  // 如果用户未登录，重定向到登录页
  if (!session?.user) {
    redirect('/login')
  }

  // 获取用户设置
  const settings = await getUserSettings()

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">设置</h1>
        <p className="text-muted-foreground mt-2">自定义您的阅读体验和偏好设置</p>
      </div>

      <SettingsPanel initialSettings={settings} />
    </div>
  )
}
