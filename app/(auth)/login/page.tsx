import { signIn } from '@/lib/auth'
import Link from 'next/link'

function getLoginErrorMessage(error?: string) {
  switch (error) {
    case 'CallbackRouteError':
      return '登录回调失败，请稍后重试。若持续失败，通常是服务端存储或第三方登录配置异常。'
    case 'OAuthCallbackError':
    case 'OAuthSignin':
      return '第三方登录握手失败，请重试一次。若持续失败，请检查 OAuth 回调域名配置。'
    case 'AccessDenied':
      return '登录请求被拒绝，请确认您已完成第三方授权。'
    case 'Configuration':
      return '认证服务配置异常，请稍后再试。'
    default:
      return error ? '登录失败，请稍后重试。' : null
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>
}) {
  const params = await searchParams
  const callbackUrl = params.callbackUrl || '/'
  const errorMessage = getLoginErrorMessage(params.error)

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-xl dark:bg-gray-800">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">摇头看新闻</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">登录以同步您的设置和偏好</p>
        </div>

        {errorMessage && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
            <p>{errorMessage}</p>
            <p className="mt-1 text-xs opacity-80">错误代码: {params.error}</p>
          </div>
        )}

        <div className="mt-8 space-y-4">
          <form
            action={async () => {
              'use server'
              await signIn('google', { redirectTo: callbackUrl })
            }}
          >
            <button
              type="submit"
              className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              使用 Google 登录
            </button>
          </form>

          <form
            action={async () => {
              'use server'
              await signIn('microsoft-entra-id', { redirectTo: callbackUrl })
            }}
          >
            <button
              type="submit"
              className="flex w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-700 transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 21 21" fill="currentColor">
                <path fill="#f25022" d="M1 1h9v9H1z" />
                <path fill="#00a4ef" d="M1 11h9v9H1z" />
                <path fill="#7fba00" d="M11 1h9v9H11z" />
                <path fill="#ffb900" d="M11 11h9v9H11z" />
              </svg>
              使用 Microsoft 登录
            </button>
          </form>

          <div className="text-center text-xs text-gray-500 dark:text-gray-400">
            登录即表示您同意我们的服务条款和隐私政策
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400">
            继续浏览（无需登录）
          </Link>
        </div>
      </div>
    </div>
  )
}
