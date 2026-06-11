import { useEffect, useState } from 'react'
import { getAuditLog } from '@/services/imageService'
import { RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

interface AuditEntry {
  id: string
  created_at: string
  user_id: string | null
  actor_email: string | null
  action: string
  property_id: string | null
  image_id: string | null
  bucket: string | null
  path: string | null
  details: Record<string, unknown>
}

const ACTIONS = ['all', 'upload', 'soft_delete', 'restore', 'hard_delete', 'purge', 'reapply']

const ACTION_STYLES: Record<string, string> = {
  upload: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  soft_delete: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  restore: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  hard_delete: 'bg-destructive/15 text-destructive',
  purge: 'bg-foreground/15 text-foreground',
  reapply: 'bg-violet-500/15 text-violet-700 dark:text-violet-400',
}

export function MediaAuditLogPanel() {
  const [items, setItems] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  const load = async () => {
    setLoading(true)
    try {
      setItems((await getAuditLog(1, filter)) as AuditEntry[])
    } catch (e: any) {
      toast.error(e.message || 'Failed to load audit log')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [filter])

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium text-foreground">Media Audit Log</h3>
          <p className="text-xs text-muted-foreground">Last 200 entries. Tracks every upload, deletion, restore, purge, and watermark re-apply.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-md bg-secondary border-0 focus:ring-2 focus:ring-accent/40 outline-none"
          >
            {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <button onClick={load} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground p-4 bg-secondary rounded-md">No audit entries yet.</p>
      ) : (
        <div className="border border-border rounded-md overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-secondary text-muted-foreground">
              <tr>
                <th className="text-left px-3 py-2 font-medium">When</th>
                <th className="text-left px-3 py-2 font-medium">Action</th>
                <th className="text-left px-3 py-2 font-medium">Actor</th>
                <th className="text-left px-3 py-2 font-medium">Property</th>
                <th className="text-left px-3 py-2 font-medium">Path</th>
                <th className="text-left px-3 py-2 font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {items.map(e => (
                <tr key={e.id} className="border-t border-border align-top">
                  <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                    {new Date(e.created_at).toLocaleString()}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${ACTION_STYLES[e.action] ?? 'bg-secondary text-foreground'}`}>
                      {e.action}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {e.actor_email || (e.user_id ? e.user_id.slice(0, 8) : 'system')}
                  </td>
                  <td className="px-3 py-2 font-mono text-[10px] text-muted-foreground">
                    {e.property_id ? e.property_id.slice(0, 8) : '—'}
                  </td>
                  <td className="px-3 py-2 font-mono text-[10px] text-muted-foreground break-all max-w-[260px]">
                    {e.path || '—'}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {Object.keys(e.details || {}).length > 0 ? (
                      <code className="text-[10px]">{JSON.stringify(e.details)}</code>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
