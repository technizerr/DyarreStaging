import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { login, logout, getMe, type AuthUser } from '@/services/authService'

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  isAdmin: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMe().then(u => {
      setUser(u)
      setLoading(false)
    })
  }, [])

  async function signIn(email: string, password: string): Promise<{ error: Error | null }> {
    try {
      const { user } = await login(email, password)
      setUser(user)
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Login failed') }
    }
  }

  async function signOut() {
    await logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin: user?.role === 'admin', signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
