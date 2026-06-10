import { useState, useEffect, useMemo } from "react";
import { AdminLayout } from "./AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Eye, Globe, Clock, TrendingUp, ArrowUpDown, Brain, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PageVisit {
  id: string;
  page_path: string;
  visitor_id: string;
  user_agent: string | null;
  referrer: string | null;
  created_at: string;
  ip_address: string | null;
  country: string | null;
  session_duration: number | null;
}

type TimeRange = "today" | "7d" | "30d" | "all";

export default function VisitorStats() {
  const [visits, setVisits] = useState<PageVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<TimeRange>("7d");
  const [sortField, setSortField] = useState<"visits" | "page">("visits");
  const [sortAsc, setSortAsc] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    fetchVisits();
  }, [range]);

  const fetchVisits = async () => {
    setLoading(true);
    let query = supabase.from("page_visits").select("*").order("created_at", { ascending: false });

    const now = new Date();
    if (range === "today") {
      query = query.gte("created_at", new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString());
    } else if (range === "7d") {
      query = query.gte("created_at", new Date(now.getTime() - 7 * 86400000).toISOString());
    } else if (range === "30d") {
      query = query.gte("created_at", new Date(now.getTime() - 30 * 86400000).toISOString());
    }

    const { data } = await query;
    setVisits(data || []);
    setLoading(false);
  };

  const stats = useMemo(() => {
    const uniqueVisitors = new Set(visits.map((v) => v.visitor_id)).size;
    const totalViews = visits.length;
    const pages = new Map<string, { views: number; uniqueVisitors: Set<string> }>();

    visits.forEach((v) => {
      const entry = pages.get(v.page_path) || { views: 0, uniqueVisitors: new Set<string>() };
      entry.views++;
      entry.uniqueVisitors.add(v.visitor_id);
      pages.set(v.page_path, entry);
    });

    const pageStats = Array.from(pages.entries())
      .map(([path, data]) => ({ path, views: data.views, unique: data.uniqueVisitors.size }))
      .sort((a, b) => {
        if (sortField === "visits") return sortAsc ? a.views - b.views : b.views - a.views;
        return sortAsc ? a.path.localeCompare(b.path) : b.path.localeCompare(a.path);
      });

    // Recent visits (last 20)
    const recent = visits.slice(0, 20);

    // Referrers
    const refMap = new Map<string, number>();
    visits.forEach((v) => {
      const ref = v.referrer || "Direct";
      refMap.set(ref, (refMap.get(ref) || 0) + 1);
    });
    const referrers = Array.from(refMap.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Hourly distribution for bar chart
    const hourly = new Array(24).fill(0);
    visits.forEach((v) => {
      hourly[new Date(v.created_at).getHours()]++;
    });

    return { uniqueVisitors, totalViews, pageStats, recent, referrers, hourly };
  }, [visits, sortField, sortAsc]);

  const toggleSort = (field: "visits" | "page") => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(false); }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const maxHourly = Math.max(...stats.hourly, 1);

  const runAiAnalysis = async (provider: "lovable" | "custom" = "lovable") => {
    setAnalyzing(true);
    setAiAnalysis(null);
    try {
      const body: any = { provider };
      // For custom provider, the edge function reads the key from site_settings server-side.
      const { data, error } = await supabase.functions.invoke("analyze-visitors", { body });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); }
      else { setAiAnalysis(data.analysis); }

    } catch (err: any) {
      toast.error(err.message || "Analysis failed");
    }
    setAnalyzing(false);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-semibold text-foreground">Visitor Statistics</h1>
            <p className="text-sm text-muted-foreground mt-1">Track page views and visitor activity</p>
          </div>
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            {(["today", "7d", "30d", "all"] as TimeRange[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  range === r ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r === "today" ? "Today" : r === "7d" ? "7 Days" : r === "30d" ? "30 Days" : "All Time"}
              </button>
            ))}
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Views</span>
                <Eye className="w-5 h-5 text-accent" />
              </div>
              <div className="mt-2 text-2xl font-display font-semibold text-foreground">
                {loading ? "…" : stats.totalViews.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Unique Visitors</span>
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div className="mt-2 text-2xl font-display font-semibold text-foreground">
                {loading ? "…" : stats.uniqueVisitors.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pages Tracked</span>
                <Globe className="w-5 h-5 text-green-600" />
              </div>
              <div className="mt-2 text-2xl font-display font-semibold text-foreground">
                {loading ? "…" : stats.pageStats.length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Avg Views/Visitor</span>
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
              <div className="mt-2 text-2xl font-display font-semibold text-foreground">
                {loading ? "…" : stats.uniqueVisitors > 0 ? (stats.totalViews / stats.uniqueVisitors).toFixed(1) : "0"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Hourly activity bar */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4" /> Hourly Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 h-32">
              {stats.hourly.map((count, hour) => (
                <div key={hour} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-accent/80 rounded-t transition-all hover:bg-accent"
                    style={{ height: `${(count / maxHourly) * 100}%`, minHeight: count > 0 ? 4 : 0 }}
                    title={`${hour}:00 — ${count} views`}
                  />
                  {hour % 4 === 0 && (
                    <span className="text-[10px] text-muted-foreground">{hour}h</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Analysis */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="w-4 h-4" /> AI Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Button size="sm" onClick={() => runAiAnalysis("lovable")} disabled={analyzing}>
                {analyzing ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Brain className="w-4 h-4 mr-1" />}
                Analyze with AI
              </Button>
              <Button size="sm" variant="outline" onClick={() => runAiAnalysis("custom")} disabled={analyzing}>
                Custom AI Provider
              </Button>
            </div>
            {aiAnalysis && (
              <div className="prose prose-sm max-w-none text-foreground bg-secondary rounded-lg p-4 whitespace-pre-wrap">
                {aiAnalysis}
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="pages" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pages">Pages</TabsTrigger>
            <TabsTrigger value="recent">Recent Visits</TabsTrigger>
            <TabsTrigger value="referrers">Referrers</TabsTrigger>
            <TabsTrigger value="countries">Countries</TabsTrigger>
          </TabsList>

          <TabsContent value="pages">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Button variant="ghost" size="sm" onClick={() => toggleSort("page")} className="gap-1 -ml-3">
                          Page Path <ArrowUpDown className="w-3 h-3" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button variant="ghost" size="sm" onClick={() => toggleSort("visits")} className="gap-1 -ml-3">
                          Views <ArrowUpDown className="w-3 h-3" />
                        </Button>
                      </TableHead>
                      <TableHead>Unique Visitors</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Loading…</TableCell></TableRow>
                    ) : stats.pageStats.length === 0 ? (
                      <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No data yet</TableCell></TableRow>
                    ) : (
                      stats.pageStats.map((p) => (
                        <TableRow key={p.path}>
                          <TableCell className="font-mono text-sm">{p.path}</TableCell>
                          <TableCell>{p.views}</TableCell>
                          <TableCell>{p.unique}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recent">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Page</TableHead>
                      <TableHead>Visitor</TableHead>
                      <TableHead>Referrer</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Loading…</TableCell></TableRow>
                    ) : stats.recent.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No data yet</TableCell></TableRow>
                    ) : (
                      stats.recent.map((v) => (
                        <TableRow key={v.id}>
                          <TableCell className="text-xs whitespace-nowrap">{formatTime(v.created_at)}</TableCell>
                          <TableCell className="font-mono text-sm">{v.page_path}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{v.visitor_id.slice(0, 8)}…</TableCell>
                          <TableCell className="text-xs text-muted-foreground truncate max-w-[200px]">{v.referrer || "Direct"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="referrers">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Source</TableHead>
                      <TableHead>Visits</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">Loading…</TableCell></TableRow>
                    ) : stats.referrers.length === 0 ? (
                      <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">No data yet</TableCell></TableRow>
                    ) : (
                      stats.referrers.map((r) => (
                        <TableRow key={r.source}>
                          <TableCell className="text-sm truncate max-w-[400px]">{r.source}</TableCell>
                          <TableCell>{r.count}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="countries">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Country</TableHead>
                      <TableHead>Visits</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      const countryMap = new Map<string, number>();
                      visits.forEach(v => {
                        const c = v.country || "Unknown";
                        countryMap.set(c, (countryMap.get(c) || 0) + 1);
                      });
                      const countries = Array.from(countryMap.entries()).sort((a, b) => b[1] - a[1]);
                      if (loading) return <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">Loading…</TableCell></TableRow>;
                      if (countries.length === 0) return <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">No data yet</TableCell></TableRow>;
                      return countries.map(([country, count]) => (
                        <TableRow key={country}>
                          <TableCell>{country}</TableCell>
                          <TableCell>{count}</TableCell>
                        </TableRow>
                      ));
                    })()}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
