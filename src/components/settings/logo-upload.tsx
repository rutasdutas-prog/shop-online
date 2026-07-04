'use client'

import { useRef, useState } from 'react'

export function LogoUpload({ currentLogo }: { currentLogo?: string | null }) {
  const [preview, setPreview] = useState<string | null>(currentLogo || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('File terlalu besar. Maksimal 2MB.')
        return
      }
      setPreview(URL.createObjectURL(file))
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="w-16 h-16 rounded-xl bg-zinc-100 border border-zinc-200 overflow-hidden flex items-center justify-center shrink-0">
        {preview ? (
          <img src={preview} alt="Logo" className="w-full h-full object-cover" />
        ) : (
          <span className="text-zinc-400 text-xs text-center px-2">Logo</span>
        )}
      </div>
      <div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="text-xs font-medium bg-white border border-zinc-200 px-3 py-1.5 rounded-lg text-zinc-700 hover:bg-zinc-50 transition-colors"
        >
          Pilih Foto
        </button>
        <p className="text-[10px] text-zinc-400 mt-1.5">JPG, PNG maks 2MB. Rasio 1:1 direkomendasikan.</p>
        <input
          ref={fileInputRef}
          type="file"
          name="logo"
          accept="image/jpeg,image/png"
          className="hidden"
          onChange={e => {
            if (e.target.files?.[0]) handleFile(e.target.files[0])
          }}
        />
        <input type="hidden" name="existing_logo" value={currentLogo || ''} />
      </div>
    </div>
  )
}
