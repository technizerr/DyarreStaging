import { useEffect, useState } from 'react'
import { restoreImage, hardDeleteImage, listTrash } from '@/services/imageService'
import { toast } from 'sonner'
import { Trash2, Undo2, RefreshCw } from 'lucide-react'

interface TrashImage {
  id: string
  image_url: string
  property_id: string
  deleted_at: string
  original_path: string | null
}

interface Props {
  propertyId?: string
  onChange?: () => void
}

export function MediaTrashPanel({ propertyId, onChange }: Props) {
  const [items, setItems] = useState<TrashImage[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const all = (await listTrash()) as TrashImage[]
      setItems(propertyId ? all.filter(i => i.property_id === propertyId) : all)
    } catch {
      toast.error('Failed to load trash')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [propertyId])

  const restore = async (img: TrashImage) => {
    try {
      await restoreImage(img.id)
      toast.success('Image restored')
      load()
      onChange?.()
    } catch (e: any) {
      toast.error(e.message || 'Failed to restore image')
    }
  }

  const hardDelete = async (img: TrashImage) => {
    if (!confirm('Permanently delete this image? This cannot be undone.')) return
    try {
      await hardDeleteImage(img.id)
      toast.success('Permanently deleted')
      load()
      onChange?.()
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete image')
    }
  }

  const daysLeft = (deletedAt: string) => {
    const expires = new Date(deletedAt).getTime() + 30 * 86400000
    return Math.max(0, Math.ceil((expires - Date.now()) / 86400000))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Soft-deleted images. Files auto-purge 30 days after deletion.
        </p>
        <button onClick={load} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground p-4 bg-secondary rounded-md">Trash is empty.</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {items.map(img => (
            <div key={img.id} className="relative group aspect-square rounded-md overflow-hidden border border-border">
              <img src={img.image_url} alt="" className="w-full h-full object-cover opacity-60" />
              <div className="absolute inset-0 bg-foreground/40 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-2">
                <button onClick={() => restore(img)} className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-card text-foreground rounded">
                  <Undo2 className="w-3 h-3" /> Restore
                </button>
                <button onClick={() => hardDelete(img)} className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-destructive text-destructive-foreground rounded">
                  <Trash2 className="w-3 h-3" /> Delete now
                </button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-foreground/70 text-primary-foreground text-[10px] text-center py-0.5">
                {daysLeft(img.deleted_at)}d left
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
