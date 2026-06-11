const API = import.meta.env.VITE_API_BASE_URL

function token() { return localStorage.getItem('access_token') }

export async function getPublicSetting(key: string): Promise<unknown> {
  const res = await fetch(`${API}/api/settings/${key}`)
  if (!res.ok) return null
  return res.json()
}

export async function getSetting(key: string): Promise<unknown> {
  const res = await fetch(`${API}/api/settings/admin/${key}`, {
    headers: { Authorization: `Bearer ${token()}` },
  })
  if (!res.ok) return null
  return res.json()
}

export async function saveSetting(key: string, value: unknown): Promise<void> {
  await fetch(`${API}/api/settings/admin/${key}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
    body: JSON.stringify({ value }),
  })
}
