import { useState, useEffect, type ReactNode } from "react";
import { Link, useLocation, Navigate } from "react-router-dom";
import { LayoutDashboard, Building2, Users, Database, Settings, LogOut, Menu, X, BarChart3, FileText, MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user, loading, isAdmin, signOut } = useAuth();
  const [expiryCount, setExpiryCount] = useState(0);
  const [newLeadsCount, setNewLeadsCount] = useState(0);

  useEffect(() => {
    if (!user || !isAdmin) return;
    const fetchCounts = async () => {
      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 86400000).toISOString().split("T")[0];
      const yesterday = new Date(now.getTime() - 86400000).toISOString();
      const [expiryRes, leadsRes] = await Promise.all([
        supabase.from("properties").select("id").not("expiry_date", "is", null).lte("expiry_date", sevenDaysFromNow),
        supabase.from("contact_submissions").select("id", { count: "exact", head: true }).gte("created_at", yesterday),
      ]);
      setExpiryCount(expiryRes.data?.length || 0);
      setNewLeadsCount(leadsRes.count || 0);
    };
    fetchCounts();
  }, [user, isAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/admin/login" replace />;
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-display font-semibold text-foreground">Access Denied</h1>
          <p className="mt-2 text-muted-foreground">You do not have admin privileges.</p>
          <Link to="/" className="mt-4 inline-block text-sm text-accent hover:underline">← Back to Website</Link>
        </div>
      </div>
    );
  }

  const links = [
    { to: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/admin/properties", icon: Building2, label: "Properties", badge: expiryCount > 0 ? expiryCount : undefined },
    { to: "/admin/leads", icon: MessageCircle, label: "Leads", badge: newLeadsCount > 0 ? newLeadsCount : undefined },
    { to: "/admin/users", icon: Users, label: "Users" },
    { to: "/admin/visitors", icon: BarChart3, label: "Visitor Stats" },
    { to: "/admin/migrations", icon: Database, label: "Migrations" },
    { to: "/admin/settings", icon: Settings, label: "Settings" },
    { to: "/docs", icon: FileText, label: "Documentation" },
  ];

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/admin/login";
  };

  return (
    <div className="min-h-screen flex bg-background">
      <aside className={`fixed inset-y-0 left-0 z-40 w-60 bg-card border-r border-border transform transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between h-16 px-5 border-b border-border">
          <Link to="/admin" className="text-lg font-display font-semibold text-foreground">
            Admin<span className="text-accent">Panel</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden"><X className="w-5 h-5" /></button>
        </div>
        <nav className="p-4 space-y-1">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                location.pathname === link.to
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <link.icon className="w-4 h-4" />
              {link.label}
              {link.badge && (
                <span className="ml-auto inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold bg-destructive text-destructive-foreground rounded-full">
                  {link.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-4 left-4 right-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary w-full transition-colors"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
          <Link to="/" className="block mt-2 px-3 py-2 text-xs text-muted-foreground hover:text-accent text-center">
            ← Back to Website
          </Link>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-30 bg-foreground/30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1 lg:ml-60">
        <header className="sticky top-0 z-20 h-16 flex items-center gap-4 px-6 bg-card/80 backdrop-blur-md border-b border-border">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden"><Menu className="w-5 h-5" /></button>
          <h2 className="text-sm font-medium text-muted-foreground">dyarre Administration</h2>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
