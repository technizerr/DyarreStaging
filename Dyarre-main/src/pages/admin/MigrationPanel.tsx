import { useState, useEffect } from "react";
import { AdminLayout } from "./AdminLayout";
import { Database, CheckCircle, AlertCircle, Play, RefreshCw, Cloud, Server, Wifi, WifiOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface MigrationStep {
  name: string;
  table: string;
  status: "pending" | "running" | "success" | "error";
  message?: string;
  rowCount?: number;
}

const requiredTables = [
  { name: "Profiles", table: "profiles" },
  { name: "User Roles", table: "user_roles" },
  { name: "Locations (City/Zone)", table: "locations" },
  { name: "Property Types", table: "property_types" },
  { name: "Property Statuses", table: "property_statuses" },
  { name: "Furnishing Options", table: "furnishing_options" },
  { name: "Properties", table: "properties" },
  { name: "Property Images", table: "property_images" },
  { name: "Contact Submissions", table: "contact_submissions" },
  { name: "Site Settings", table: "site_settings" },
];

export default function MigrationPanel() {
  const { isAdmin } = useAuth();
  const [steps, setSteps] = useState<MigrationStep[]>(
    requiredTables.map((t) => ({ name: t.name, table: t.table, status: "pending" }))
  );
  const [isRunning, setIsRunning] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  // MySQL API test state
  const [backendMode, setBackendMode] = useState<string>("cloud");
  const [apiBaseUrl, setApiBaseUrl] = useState("");
  const [apiStatus, setApiStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [apiMessage, setApiMessage] = useState("");

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "backend_config")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value && typeof data.value === "object") {
          const cfg = data.value as Record<string, string>;
          setBackendMode(cfg.mode || "cloud");
          setApiBaseUrl(cfg.apiBaseUrl || "");
        }
      });
  }, []);

  if (!isAdmin) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Database className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-display font-semibold text-foreground">Access Denied</h2>
            <p className="text-sm text-muted-foreground mt-2">Only administrators can run migrations.</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const verifyTables = async () => {
    setIsRunning(true);
    setLog([]);
    const addLog = (msg: string) => setLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

    addLog("Starting Lovable Cloud database verification…");

    for (let i = 0; i < requiredTables.length; i++) {
      const t = requiredTables[i];
      setSteps((prev) => prev.map((s, idx) => (idx === i ? { ...s, status: "running" } : s)));
      addLog(`Checking table: ${t.table}…`);

      try {
        const { error, count } = await supabase
          .from(t.table as any)
          .select("*", { count: "exact", head: true });

        if (error) throw error;

        const rowCount = count ?? 0;
        addLog(`✓ Table '${t.table}' exists — ${rowCount} rows`);
        setSteps((prev) =>
          prev.map((s, idx) =>
            idx === i ? { ...s, status: "success", message: `${rowCount} rows`, rowCount } : s
          )
        );
      } catch (err: any) {
        addLog(`✗ Table '${t.table}' — ${err.message}`);
        setSteps((prev) =>
          prev.map((s, idx) => (idx === i ? { ...s, status: "error", message: err.message } : s))
        );
      }
    }

    addLog("✓ Cloud verification complete!");
    setIsRunning(false);
  };

  const testMysqlApi = async () => {
    if (!apiBaseUrl) {
      toast.error("No API Base URL configured. Set it in Settings first.");
      return;
    }
    setApiStatus("testing");
    setApiMessage("Testing connection to your API server…");

    try {
      const { data, error } = await supabase.functions.invoke("test-mysql", {
        body: { apiBaseUrl },
      });

      if (error) throw error;

      if (data?.success) {
        setApiStatus("success");
        setApiMessage(data.message || "API is reachable and responding");
        toast.success("API server connected successfully");
      } else {
        setApiStatus("error");
        setApiMessage(data?.message || "API server not reachable");
        toast.error(data?.message || "Connection failed");
      }
    } catch (err: any) {
      setApiStatus("error");
      setApiMessage(err.message || "Failed to test connection");
      toast.error(err.message);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-semibold text-foreground">Database Verification</h1>
            <p className="text-sm text-muted-foreground mt-1">Verify database tables and test external connections</p>
          </div>
          <button
            onClick={verifyTables}
            disabled={isRunning}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:opacity-90 active:scale-[0.97] disabled:opacity-50"
          >
            {isRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {isRunning ? "Verifying…" : "Verify Cloud Tables"}
          </button>
        </div>

        {/* MySQL API Connection Test */}
        {backendMode === "mysql" && (
          <div className="bg-card rounded-lg border border-border p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Server className="w-5 h-5 text-accent" />
              <h3 className="font-display font-semibold text-foreground">MySQL API Connection Test</h3>
            </div>

            <div className="text-sm text-muted-foreground space-y-2">
              <p>This tests if your Node.js API server is reachable at:</p>
              <code className="block px-3 py-2 bg-secondary rounded-md text-foreground text-xs">
                {apiBaseUrl || "(Not configured — go to Settings)"}
              </code>
              <p className="text-xs">
                The test sends a request to <code>{apiBaseUrl}/api/health</code>. Make sure your API server
                exposes a <code>GET /api/health</code> endpoint that returns a JSON response.
              </p>
            </div>

            {apiStatus !== "idle" && (
              <div className={`flex items-center gap-3 p-3 rounded-lg text-sm ${
                apiStatus === "success" ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400" :
                apiStatus === "error" ? "bg-destructive/10 text-destructive" :
                "bg-secondary text-muted-foreground"
              }`}>
                {apiStatus === "testing" && <RefreshCw className="w-4 h-4 animate-spin" />}
                {apiStatus === "success" && <Wifi className="w-4 h-4" />}
                {apiStatus === "error" && <WifiOff className="w-4 h-4" />}
                {apiMessage}
              </div>
            )}

            <button
              onClick={testMysqlApi}
              disabled={apiStatus === "testing" || !apiBaseUrl}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-accent text-accent-foreground rounded-md hover:opacity-90 disabled:opacity-50"
            >
              {apiStatus === "testing" ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
              {apiStatus === "testing" ? "Testing…" : "Test API Connection"}
            </button>
          </div>
        )}

        {/* Cloud Table Status */}
        <div className="bg-card rounded-lg border border-border">
          <div className="p-4 border-b border-border flex items-center gap-2">
            <Cloud className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-semibold text-foreground">Lovable Cloud Tables</h3>
          </div>
          <div className="divide-y divide-border">
            {steps.map((step) => (
              <div key={step.table} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  {step.status === "success" ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : step.status === "error" ? (
                    <AlertCircle className="w-5 h-5 text-destructive" />
                  ) : step.status === "running" ? (
                    <RefreshCw className="w-5 h-5 text-accent animate-spin" />
                  ) : (
                    <Database className="w-5 h-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-foreground">{step.name}</p>
                    <p className="text-xs text-muted-foreground">{step.table}</p>
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded ${
                    step.status === "success"
                      ? "bg-accent/10 text-accent"
                      : step.status === "error"
                      ? "bg-destructive/10 text-destructive"
                      : step.status === "running"
                      ? "bg-accent/10 text-accent"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {step.message || step.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Log */}
        {log.length > 0 && (
          <div className="bg-foreground rounded-lg p-4">
            <h3 className="text-sm font-semibold text-primary-foreground mb-3">Verification Log</h3>
            <div className="space-y-1 font-mono text-xs text-primary-foreground/70 max-h-64 overflow-y-auto">
              {log.map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
