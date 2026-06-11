import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from './AdminLayout'
import { UserPlus, Trash2, Shield, RefreshCw } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { listUsers, createUser, deleteUser, updateUserRole, type AdminUser } from '@/services/adminService'
import { toast } from 'sonner'

export default function UserManagement() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', role: 'user', password: '' })
  const { isAdmin, user: currentUser } = useAuth()

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      setUsers(await listUsers())
    } catch {
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isAdmin) fetchUsers()
  }, [isAdmin, fetchUsers])

  if (!isAdmin) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-display font-semibold text-foreground">Access Denied</h2>
            <p className="text-sm text-muted-foreground mt-2">Only administrators can manage users.</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await createUser(formData.email, formData.password, formData.name, formData.role)
      toast.success(`User ${formData.email} created successfully`)
      setShowForm(false)
      setFormData({ name: '', email: '', role: 'user', password: '' })
      fetchUsers()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create user')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This cannot be undone.')) return
    try {
      await deleteUser(userId)
      toast.success('User deleted')
      fetchUsers()
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete user')
    }
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await updateUserRole(userId, newRole as 'admin' | 'moderator' | 'user')
      toast.success('Role updated')
      fetchUsers()
    } catch (err: any) {
      toast.error(err.message || 'Failed to update role')
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-semibold text-foreground">User Management</h1>
            <p className="text-sm text-muted-foreground mt-1">{users.length} users</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchUsers} disabled={loading} className="p-2.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-secondary">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:opacity-90 active:scale-[0.97]">
              <UserPlus className="w-4 h-4" /> Add User
            </button>
          </div>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="bg-card border border-border rounded-lg p-6 space-y-4">
            <h3 className="font-display font-semibold text-foreground">New User</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-2">Display Name</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))} className="w-full px-4 py-2.5 text-sm rounded-md bg-secondary border-0 focus:ring-2 focus:ring-accent/40 outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-2">Email</label>
                <input type="email" required value={formData.email} onChange={(e) => setFormData(f => ({ ...f, email: e.target.value }))} className="w-full px-4 py-2.5 text-sm rounded-md bg-secondary border-0 focus:ring-2 focus:ring-accent/40 outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-2">Password</label>
                <input type="password" required minLength={6} value={formData.password} onChange={(e) => setFormData(f => ({ ...f, password: e.target.value }))} className="w-full px-4 py-2.5 text-sm rounded-md bg-secondary border-0 focus:ring-2 focus:ring-accent/40 outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-2">Role</label>
                <select value={formData.role} onChange={(e) => setFormData(f => ({ ...f, role: e.target.value }))} className="w-full px-4 py-2.5 text-sm rounded-md bg-secondary border-0 focus:ring-2 focus:ring-accent/40 outline-none">
                  <option value="admin">Admin</option>
                  <option value="moderator">Moderator</option>
                  <option value="user">User</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2.5 text-sm border border-border rounded-md">Cancel</button>
              <button type="submit" disabled={submitting} className="px-4 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-md disabled:opacity-50">
                {submitting ? 'Creating…' : 'Create User'}
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="bg-card rounded-lg border border-border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="p-4 font-medium text-muted-foreground">Name</th>
                  <th className="p-4 font-medium text-muted-foreground">Email</th>
                  <th className="p-4 font-medium text-muted-foreground">Role</th>
                  <th className="p-4 font-medium text-muted-foreground">Created</th>
                  <th className="p-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-border/50">
                    <td className="p-4 font-medium text-foreground">{u.displayName ?? '—'}</td>
                    <td className="p-4 text-muted-foreground">{u.email}</td>
                    <td className="p-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        disabled={u.id === currentUser?.id}
                        className="px-2 py-0.5 text-xs rounded bg-secondary border-0 outline-none disabled:opacity-50"
                      >
                        <option value="admin">Admin</option>
                        <option value="moderator">Moderator</option>
                        <option value="user">User</option>
                      </select>
                    </td>
                    <td className="p-4 text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="p-4">
                      {u.id !== currentUser?.id && (
                        <button onClick={() => handleDelete(u.id)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">No users found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
