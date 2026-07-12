'use client'

import React, { useState, useRef, useCallback } from 'react'

export interface PreviewItem {
  id: string
  url: string
  type: string
  name: string
  isExisting?: boolean
  file?: File
}

interface ImageSortableGalleryProps {
  previews: PreviewItem[]
  setPreviews: React.Dispatch<React.SetStateAction<PreviewItem[]>>
  onDeleted?: (url: string) => void
}

export default function ImageSortableGallery({ previews, setPreviews, onDeleted }: ImageSortableGalleryProps) {
  const [dropZoneDragOver, setDropZoneDragOver] = useState(false)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  // Use ref to track dragged index to avoid stale closure issues
  const draggedIndexRef = useRef<number | null>(null)

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'video/mp4']
    const maxMB = 5
    const newItems: PreviewItem[] = []

    let currentPhotos = previews.filter(p => p.type.startsWith('image')).length
    let currentVideos = previews.filter(p => p.type.startsWith('video')).length

    for (const file of Array.from(fileList)) {
      if (!allowed.includes(file.type)) { alert(`Format tidak didukung: ${file.name}. Gunakan JPG, PNG, atau MP4.`); continue }
      if (file.size > maxMB * 1024 * 1024) { alert(`File terlalu besar: ${file.name}. Maks. 5MB.`); continue }
      const isVideo = file.type.startsWith('video')
      if (isVideo) {
        if (currentVideos >= 1) { alert('Maksimal 1 video.'); continue }
        currentVideos++
      } else {
        if (currentPhotos >= 10) { alert('Maksimal 10 foto.'); continue }
        currentPhotos++
      }
      newItems.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, url: URL.createObjectURL(file), type: file.type, name: file.name, file })
    }
    if (newItems.length > 0) setPreviews(p => [...p, ...newItems])
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    draggedIndexRef.current = index
    e.dataTransfer.effectAllowed = 'move'
    // Small timeout so the drag image captures correctly
    setTimeout(() => setDragOverIndex(index), 0)
  }

  const handleDragEnterItem = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    e.stopPropagation()
    const sourceIndex = draggedIndexRef.current
    if (sourceIndex === null || sourceIndex === targetIndex) return

    setDragOverIndex(targetIndex)
    // Reorder the array
    setPreviews(prev => {
      const arr = [...prev]
      const [removed] = arr.splice(sourceIndex, 1)
      arr.splice(targetIndex, 0, removed)
      return arr
    })
    // Update the ref to track the new position
    draggedIndexRef.current = targetIndex
  }

  const handleDragEnd = () => {
    draggedIndexRef.current = null
    setDragOverIndex(null)
  }

  const removePreview = useCallback((index: number) => {
    setPreviews(prev => {
      const item = prev[index]
      if (item?.isExisting && onDeleted) onDeleted(item.url)
      return prev.filter((_, i) => i !== index)
    })
  }, [setPreviews, onDeleted])

  return (
    <div className="bg-white rounded-xl border border-zinc-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-zinc-700">Foto &amp; Video Produk</h2>
        <span className="text-xs text-zinc-400">{previews.filter(p=>p.type.startsWith('image')).length}/10 foto · {previews.filter(p=>p.type.startsWith('video')).length}/1 video</span>
      </div>

      {/* Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${dropZoneDragOver ? 'border-blue-400 bg-blue-50' : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'}`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDropZoneDragOver(true) }}
        onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropZoneDragOver(false) }}
        onDrop={e => { e.preventDefault(); setDropZoneDragOver(false); handleFiles(e.dataTransfer.files) }}
      >
        <div className="text-2xl mb-1.5">📸</div>
        <p className="text-sm font-medium text-zinc-700">Klik atau drag &amp; drop foto / video</p>
        <p className="text-xs text-zinc-400 mt-0.5">JPG, PNG, MP4 · Maks. 5MB · Rasio terbaik 3:4 atau 4:5</p>
        <input ref={fileInputRef} type="file" name="files" multiple accept=".jpg,.jpeg,.png,.mp4" className="hidden" onChange={e => { handleFiles(e.target.files); e.target.value = '' }} />
      </div>

      {/* Preview Grid — draggable to reorder */}
      {previews.length > 0 && (
        <div className="mt-4">
          <p className="text-[11px] text-zinc-400 mb-2">☰ Geser foto untuk mengubah urutan. Foto pertama = Foto Utama.</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
            {previews.map((p, i) => (
              <div
                key={p.id}
                draggable
                onDragStart={e => handleDragStart(e, i)}
                onDragEnter={e => handleDragEnterItem(e, i)}
                onDragOver={e => e.preventDefault()}
                onDragEnd={handleDragEnd}
                className={`relative group aspect-[3/4] rounded-lg overflow-hidden border-2 cursor-grab active:cursor-grabbing select-none transition-all ${
                  dragOverIndex === i && draggedIndexRef.current !== i
                    ? 'border-blue-400 scale-105 shadow-lg'
                    : draggedIndexRef.current === i
                    ? 'border-zinc-300 opacity-40'
                    : i === 0
                    ? 'border-yellow-400'
                    : 'border-zinc-200 hover:border-zinc-300'
                }`}
              >
                {p.type === 'video/mp4' ? (
                  <video src={p.url} className="w-full h-full object-cover pointer-events-none" />
                ) : (
                  <img src={p.url} alt={p.name} className="w-full h-full object-cover pointer-events-none" draggable={false} />
                )}

                {/* Number Badge */}
                <div className={`absolute top-1 left-1 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm leading-none ${i === 0 ? 'bg-yellow-500' : 'bg-black/65'}`}>
                  {i === 0 ? '⭐ Utama' : `Foto ${i + 1}`}
                </div>

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); removePreview(i) }}
                  className="absolute top-1 right-1 bg-black/70 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                >
                  ×
                </button>

                {p.type === 'video/mp4' && (
                  <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">▶ Video</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
