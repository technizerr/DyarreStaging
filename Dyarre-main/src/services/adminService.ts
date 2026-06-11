const API = import.meta.env.VITE_API_BASE_URL

function token() { return localStorage.getItem('access_token') }

export interface AdminUser {
  id: string
  email: string
  displayName: string | null
  role: string
  createdAt: string
}

export async function listUsers(): Promise<AdminUser[]> {
  const res = await fetch(`${API}/api/admin/users`, {
    headers: { Authorization: `Bearer ${token()}` },
  })
  return res.json()
}

export async function createUser(email: string, password: string, displayName?: string, role?: string): Promise<AdminUser> {
  const res = await fetch(`${API}/api/admin/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
    body: JSON.stringify({ email, password, displayName, role }),
  })
  if (!res.ok) throw new Error((await res.json()).error ?? 'Create user failed')
  return res.json()
}

export async function deleteUser(id: string): Promise<void> {
  await fetch(`${API}/api/admin/users/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token()}` },
  })
}

export async function updateUserRole(id: string, role: 'admin' | 'moderator' | 'user'): Promise<void> {
  await fetch(`${API}/api/admin/users/${id}/role`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
    body: JSON.stringify({ role }),
  })
}
