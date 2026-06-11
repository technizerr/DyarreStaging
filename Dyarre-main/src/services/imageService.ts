const API = import.meta.env.VITE_API_BASE_URL

function token() { return localStorage.getItem('access_token') }

export async function uploadImage(file: File, propertyId: string, isPrimary = false): Promise<unknown> {
  const form = new FormData()
  form.append('image', file)
  form.append('propertyId', propertyId)
  form.append('isPrimary', String(isPrimary))
  const res = await fetch(`${API}/api/images/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token()}` },
    body: form,
  })
  if (!res.ok) throw new Error('Image upload failed')
  return res.json()
}

export async function softDeleteImage(id: string): Promise<void> {
  await fetch(`${API}/api/images/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token()}` },
  })
}

export async function restoreImage(id: string): Promise<unknown> {
  const res = await fetch(`${API}/api/images/${id}/restore`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token()}` },
  })
  return res.json()
}

export async function listTrash(): Promise<unknown[]> {
  const res = await fetch(`${API}/api/images/trash`, {
    headers: { Authorization: `Bearer ${token()}` },
  })
  return res.json()
}

export async function getAuditLog(page = 1, action?: string): Promise<unknown[]> {
  const params = new URLSearchParams({ page: String(page) })
  if (action && action !== 'all') params.set('action', action)
  const res = await fetch(`${API}/api/images/audit-log?${params}`, {
    headers: { Authorization: `Bearer ${token()}` },
  })
  return res.json()
}

export async function hardDeleteImage(id: string): Promise<void> {
  await fetch(`${API}/api/images/${encodeURIComponent(id)}/hard-delete`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token()}` },
  })
}
