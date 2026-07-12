'use client'

import React, { useState, useRef } from 'react'

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
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'video/mp4']
    const maxMB = 5

    const newPreviews: PreviewItem[] = []
    
    let currentPhotos = previews.filter(p => p.type.startsWith('image')).length
    let currentVideos = previews.filter(p => p.type.startsWith('video')).length

    for (const file of Array.from(fileList)) {
      if (!allowed.includes(file.type)) {
        alert(`Format tidak didukung: ${file.name}. Gunakan JPG, PNG, atau MP4.`)
        continue
      }
      if (file.size > maxMB * 1024 * 1024) {
        alert(`File terlalu besar: ${file.name}. Maks. 5MB.`)
        continue
      }
      
      const isVideo = file.type.startsWith('video')
      if (isVideo) {
        if (currentVideos >= 1) {
          alert('Maksimal 1 video.')
          continue
        }
        currentVideos++
      } else {
        if (currentPhotos >= 10) {
          alert('Maksimal 10 foto.')
          continue
        }
        currentPhotos++
      }

      newPreviews.push({ 
        id: Math.random().toString(36).slice(2),
        url: URL.createObjectURL(file), 
        type: file.type, 
        name: file.name, 
        file 
      })
    }
    setPreviews(p => [...p, ...newPreviews])
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return
    
    setPreviews(prev => {
      const newItems = [...prev]
      const draggedItem = newItems[draggedIndex]
      newItems.splice(draggedIndex, 1)
      newItems.splice(index, 0, draggedItem)
      return newItems
    })
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const handleDragOverItem = (e: React.DragEvent) => {
    e.preventDefault() // necessary to allow dropping
  }

  const removePreview = (index: number) => {
    const previewToRemove = previews[index]
    if (previewToRemove.isExisting && onDeleted) {
      onDeleted(previewToRemove.url)
    }
    setPreviews(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="bg-white rounded-xl border border-zinc-100 p-5">
      <h2 className="text-sm font-medium text-zinc-700 mb-4">Foto &amp; Video Produk</h2>
      
      {/* Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${dragOver ? 'border-zinc-400 bg-zinc-50' : 'border-zinc-200 hover:border-zinc-300'}`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
      >
        <div className="text-3xl mb-2">📸</div>
        <p className="text-sm font-medium text-zinc-700">Klik atau drag &amp; drop file di sini</p>
        <p className="text-xs text-zinc-400 mt-1">JPG, PNG, MP4 · Maks. 5MB per file (Rasio 3:4 / 4:5)</p>
        <input ref={fileInputRef} type="file" name="files" multiple accept=".jpg,.jpeg,.png,.mp4" className="hidden" onChange={e => handleFiles(e.target.files)} />
      </div>

      {previews.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mt-4">
          {previews.map((p, i) => (
            <div 
              key={p.id} 
              className={`relative group rounded-lg overflow-hidden bg-zinc-100 border-2 cursor-grab active:cursor-grabbing aspect-[3/4] ${draggedIndex === i ? 'border-zinc-400 opacity-50' : 'border-zinc-200 hover:border-zinc-300'}`}
              draggable
              onDragStart={(e) => handleDragStart(e, i)}
              onDragEnter={(e) => handleDragEnter(e, i)}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOverItem}
            >
              {p.type === 'video/mp4' ? (
                <video src={p.url} className="w-full h-full object-cover pointer-events-none" />
              ) : (
                <img src={p.url} alt={p.name} className="w-full h-full object-cover pointer-events-none" draggable={false} />
              )}
              
              {/* Number Badge */}
              <div className="absolute top-1 left-1 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm flex items-center justify-center">
                {i === 0 ? 'Utama' : i + 1}
              </div>

              {/* Remove Button */}
              <button type="button" onClick={() => removePreview(i)}
                className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                ×
              </button>
              
              {p.type === 'video/mp4' && <div className="absolute bottom-1 left-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded">MP4</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
