const API = import.meta.env.VITE_API_BASE_URL

export type MediaAuditAction =
  | 'upload'
  | 'soft_delete'
  | 'restore'
  | 'purge'
  | 'reapply'
  | 'hard_delete'

interface AuditInput {
  action: MediaAuditAction
  property_id?: string | null
  image_id?: string | null
  bucket?: string | null
  path?: string | null
  details?: Record<string, unknown>
}

// Best-effort client-side audit log entry. The API logs most actions
// server-side automatically; use this only for client-initiated actions
// the server cannot observe.
export async function logMediaAction(entry: AuditInput): Promise<void> {
  try {
    const token = localStorage.getItem('access_token')
    if (!token) return
    await fetch(`${API}/api/images/audit-log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(entry),
    })
  } catch (e) {
    console.warn('[mediaAudit] error:', e)
  }
}
