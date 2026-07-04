import { resetPasswordForEmail } from '@/actions/auth.actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ForgotPasswordPage(props: { searchParams: Promise<{ message?: string, success?: string }> }) {
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
          <h1 className="text-xl font-semibold text-zinc-900 mb-1">Reset Password</h1>
          <p className="text-sm text-zinc-400 mb-6">Masukkan email Anda untuk menerima link reset password.</p>

          <form action={resetPasswordForEmail} className="space-y-4">
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

            {searchParams?.message && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-xs rounded-lg px-4 py-3">
                {searchParams.message}
              </div>
            )}

            {searchParams?.success && (
              <div className="bg-green-50 border border-green-100 text-green-600 text-xs rounded-lg px-4 py-3">
                {searchParams.success}
              </div>
            )}

            <button
              type="submit"
              className="w-full h-10 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-sm font-medium transition-all shadow-sm"
            >
              Kirim Link Reset
            </button>
          </form>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-zinc-500">
            Ingat password Anda?{' '}
            <Link href="/login" className="text-zinc-900 font-semibold hover:underline">
              Masuk
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
