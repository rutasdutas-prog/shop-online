import { login, loginWithGoogle } from '@/actions/auth.actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function LoginPage(props: { searchParams: Promise<{ message?: string }> }) {
  const searchParams = await props.searchParams
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">TK</span>
          </div>
          <span className="font-semibold text-zinc-900">TokoKita</span>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-100 p-7 shadow-sm">
          <h1 className="text-xl font-semibold text-zinc-900 mb-1">Masuk</h1>
          <p className="text-sm text-zinc-400 mb-6">Selamat datang kembali.</p>

          {/* Google Login */}
          <form action={loginWithGoogle}>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 border border-zinc-200 rounded-lg py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 transition-all font-medium mb-4"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Lanjutkan dengan Google
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-zinc-100"></div>
            <span className="text-xs text-zinc-400">atau</span>
            <div className="flex-1 h-px bg-zinc-100"></div>
          </div>

          {/* Email Login */}
          <form action={login} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium text-zinc-700">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="nama@email.com"
                required
                className="h-9 text-sm border-zinc-200"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-medium text-zinc-700">Password</Label>
                <Link href="/forgot-password" className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors">Lupa password?</Link>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                required
                className="h-9 text-sm border-zinc-200"
              />
            </div>

            {searchParams?.message && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-xs rounded-lg px-4 py-3">
                {searchParams.message}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-zinc-900 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-zinc-700 transition-colors"
            >
              Masuk →
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-zinc-400 mt-4">
          Belum punya akun?{' '}
          <Link href="/register" className="text-zinc-700 hover:text-zinc-900 font-medium transition-colors">
            Daftar sekarang
          </Link>
        </p>
      </div>
    </div>
  )
}
