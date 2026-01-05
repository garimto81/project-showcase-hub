'use client'

import { useState } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface ManualAddDialogProps {
  onAdd: (app: {
    title: string
    url: string
    description: string
    thumbnailUrl?: string
  }) => Promise<boolean>
}

export function ManualAddDialog({ onAdd }: ManualAddDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    description: '',
    thumbnailUrl: '',
  })
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.title.trim()) {
      setError('앱 이름을 입력해주세요')
      return
    }

    if (!formData.url.trim()) {
      setError('앱 URL을 입력해주세요')
      return
    }

    // URL 유효성 검사
    try {
      new URL(formData.url)
    } catch {
      setError('올바른 URL 형식이 아닙니다')
      return
    }

    setIsLoading(true)
    try {
      const success = await onAdd({
        title: formData.title.trim(),
        url: formData.url.trim(),
        description: formData.description.trim(),
        thumbnailUrl: formData.thumbnailUrl.trim() || undefined,
      })

      if (success) {
        setFormData({ title: '', url: '', description: '', thumbnailUrl: '' })
        setOpen(false)
      } else {
        setError('앱 추가에 실패했습니다')
      }
    } catch {
      setError('앱 추가 중 오류가 발생했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          수동 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>앱 수동 추가</DialogTitle>
            <DialogDescription>
              배포된 앱의 URL을 직접 입력하여 마켓에 추가합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">앱 이름 *</Label>
              <Input
                id="title"
                placeholder="My Awesome App"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="url">앱 URL *</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://my-app.vercel.app"
                value={formData.url}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, url: e.target.value }))
                }
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                placeholder="앱에 대한 간단한 설명"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                disabled={isLoading}
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="thumbnailUrl">썸네일 URL (선택)</Label>
              <Input
                id="thumbnailUrl"
                type="url"
                placeholder="https://example.com/image.png"
                value={formData.thumbnailUrl}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    thumbnailUrl: e.target.value,
                  }))
                }
                disabled={isLoading}
              />
            </div>
            {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              취소
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  추가 중...
                </>
              ) : (
                '앱 추가'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
