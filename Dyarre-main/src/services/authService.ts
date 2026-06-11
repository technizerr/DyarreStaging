const API = import.meta.env.VITE_API_BASE_URL

export interface AuthUser {
  id: string
  email: string
  displayName: string | null
  role: 'admin' | 'moderator' | 'user'
}

function getToken(): string | null {
  return localStorage.getItem('access_token')
}

function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem('access_token', accessToken)
  localStorage.setItem('refresh_token', refreshToken)
}

function clearTokens(): void {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
}

export async function login(email: string, password: string): Promise<{ user: AuthUser; accessToken: string }> {
  const res = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) throw new Error((await res.json()).error ?? 'Login failed')
  const data = await res.json()
  setTokens(data.accessToken, data.refreshToken)
  return { user: data.user, accessToken: data.accessToken }
}

export async function logout(): Promise<void> {
  const refreshToken = localStorage.getItem('refresh_token')
  await fetch(`${API}/api/auth/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
    body: JSON.stringify({ refreshToken }),
  })
  clearTokens()
}

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refresh_token')
  if (!refreshToken) return null
  const res = await fetch(`${API}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
  if (!res.ok) { clearTokens(); return null }
  const { accessToken } = await res.json()
  localStorage.setItem('access_token', accessToken)
  return accessToken
}

export async function getMe(): Promise<AuthUser | null> {
  const token = getToken()
  if (!token) return null
  const res = await fetch(`${API}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (res.status === 401) {
    const newToken = await refreshAccessToken()
    if (!newToken) return null
    const retry = await fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${newToken}` } })
    if (!retry.ok) return null
    return retry.json()
  }
  if (!res.ok) return null
  return res.json()
}
