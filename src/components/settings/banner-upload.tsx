'use client'

import { useRef, useState } from 'react'

export function BannerUpload({ currentBanner }: { currentBanner?: string | null }) {
  const [preview, setPreview] = useState<string | null>(currentBanner || null)
  const [isVideo, setIsVideo] = useState<boolean>(currentBanner?.endsWith('.mp4') || false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File terlalu besar. Maksimal 5MB.')
        return
      }
      setPreview(URL.createObjectURL(file))
      setIsVideo(file.type.startsWith('video/'))
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="w-full aspect-[9/16] max-h-[300px] md:aspect-[16/9] md:max-h-[240px] rounded-xl bg-zinc-100 border border-zinc-200 overflow-hidden flex items-center justify-center">
        {preview ? (
          isVideo ? (
            <video src={preview} className="w-full h-full object-cover" autoPlay muted loop />
          ) : (
            <img src={preview} alt="Banner" className="w-full h-full object-cover" />
          )
        ) : (
          <span className="text-zinc-400 text-xs text-center px-4">Banner Utama (Opsional)</span>
        )}
      </div>
      <div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="text-xs font-medium bg-white border border-zinc-200 px-3 py-1.5 rounded-lg text-zinc-700 hover:bg-zinc-50 transition-colors"
        >
          Pilih Foto/Video
        </button>
        <p className="text-[10px] text-zinc-400 mt-1.5">JPG, PNG, MP4 maks 5MB. Direkomendasikan 1080x1920px (Mobile) atau 1920x1080px (Desktop).</p>
        <input
          ref={fileInputRef}
          type="file"
          name="banner"
          accept="image/jpeg,image/png,video/mp4"
          className="hidden"
          onChange={e => {
            if (e.target.files?.[0]) handleFile(e.target.files[0])
          }}
        />
        <input type="hidden" name="existing_banner" value={currentBanner || ''} />
      </div>
    </div>
  )
}
