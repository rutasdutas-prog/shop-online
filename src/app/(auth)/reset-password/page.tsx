import { updatePassword } from '@/actions/auth.actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SubmitButton } from '@/components/submit-button'

export const dynamic = 'force-dynamic'

export default async function ResetPasswordPage(props: { searchParams: Promise<{ message?: string }> }) {
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
          <h1 className="text-xl font-semibold text-zinc-900 mb-1">Password Baru</h1>
          <p className="text-sm text-zinc-400 mb-6">Silakan masukkan password baru Anda.</p>

          <form action={updatePassword} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-medium text-zinc-700">Password Baru</Label>
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

            <SubmitButton pendingText="Menyimpan..." className="w-full h-10 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-sm font-medium transition-all shadow-sm">
              Simpan Password Baru
            </SubmitButton>
          </form>
        </div>
      </div>
    </div>
  )
}
