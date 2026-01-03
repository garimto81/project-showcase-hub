'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ScreenshotGalleryProps {
  screenshots: string[]
  title?: string
}

export function ScreenshotGallery({ screenshots, title = '스크린샷' }: ScreenshotGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  if (!screenshots || screenshots.length === 0) {
    return null
  }

  const openLightbox = (index: number) => setSelectedIndex(index)
  const closeLightbox = () => setSelectedIndex(null)

  const goToPrevious = () => {
    if (selectedIndex !== null) {
      setSelectedIndex(selectedIndex === 0 ? screenshots.length - 1 : selectedIndex - 1)
    }
  }

  const goToNext = () => {
    if (selectedIndex !== null) {
      setSelectedIndex(selectedIndex === screenshots.length - 1 ? 0 : selectedIndex + 1)
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>

      {/* 썸네일 그리드 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {screenshots.map((url, index) => (
          <button
            key={index}
            onClick={() => openLightbox(index)}
            className="group relative aspect-video overflow-hidden rounded-lg border bg-muted hover:ring-2 hover:ring-primary transition-all"
          >
            <Image
              src={url}
              alt={`스크린샷 ${index + 1}`}
              fill
              className="object-cover"
              unoptimized
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox 모달 */}
      <Dialog open={selectedIndex !== null} onOpenChange={() => closeLightbox()}>
        <DialogContent className="max-w-5xl w-full p-0 bg-black/95 border-none">
          <div className="relative w-full h-[80vh] flex items-center justify-center">
            {/* 닫기 버튼 */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white hover:bg-white/20 z-10"
              onClick={closeLightbox}
            >
              <X className="h-6 w-6" />
            </Button>

            {/* 이전 버튼 */}
            {screenshots.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 text-white hover:bg-white/20 z-10"
                onClick={goToPrevious}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
            )}

            {/* 이미지 */}
            {selectedIndex !== null && (
              <div className="relative w-full h-full">
                <Image
                  src={screenshots[selectedIndex]}
                  alt={`스크린샷 ${selectedIndex + 1}`}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            )}

            {/* 다음 버튼 */}
            {screenshots.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 text-white hover:bg-white/20 z-10"
                onClick={goToNext}
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            )}

            {/* 인디케이터 */}
            {screenshots.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {screenshots.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedIndex(index)}
                    className={cn(
                      'w-2 h-2 rounded-full transition-colors',
                      index === selectedIndex ? 'bg-white' : 'bg-white/40'
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
