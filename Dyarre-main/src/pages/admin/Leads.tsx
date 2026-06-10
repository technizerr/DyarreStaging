import { useState, useEffect, useMemo } from "react";
import { AdminLayout } from "./AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { MessageCircle, TrendingUp, CalendarDays, Users, ChevronDown, ChevronUp } from "lucide-react";
import { format, subDays, startOfDay, isAfter, parseISO } from "date-fns";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  property_id: string | null;
  message: string;
  created_at: string;
}

interface PropertyRef {
  id: string;
  title: string;
  reference_number: string | null;
}

type DateRange = "today" | "7d" | "30d" | "all";

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [properties, setProperties] = useState<PropertyRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const [search, setSearch] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [sortField, setSortField] = useState<"created_at" | "name">("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [leadsRes, propsRes] = await Promise.all([
        supabase.from("contact_submissions").select("*").order("created_at", { ascending: false }).limit(1000),
        supabase.from("properties").select("id, title, reference_number"),
      ]);
      setLeads(leadsRes.data || []);
      setProperties(propsRes.data || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = subDays(todayStart, 7);
  const monthStart = subDays(todayStart, 30);

  const totalLeads = leads.length;
  const leadsToday = leads.filter((l) => isAfter(parseISO(l.created_at), todayStart)).length;
  const leadsWeek = leads.filter((l) => isAfter(parseISO(l.created_at), weekStart)).length;
  const leadsMonth = leads.filter((l) => isAfter(parseISO(l.created_at), monthStart)).length;

  const propMap = useMemo(() => {
    const m: Record<string, PropertyRef> = {};
    properties.forEach((p) => (m[p.id] = p));
    return m;
  }, [properties]);

  // Filter leads by date range
  const rangeStart = dateRange === "today" ? todayStart : dateRange === "7d" ? weekStart : dateRange === "30d" ? monthStart : null;
  const rangeLeads = rangeStart ? leads.filter((l) => isAfter(parseISO(l.created_at), rangeStart)) : leads;

  // Search + property filter
  const filtered = useMemo(() => {
    let result = rangeLeads;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((l) => l.name.toLowerCase().includes(q) || l.email.toLowerCase().includes(q));
    }
    if (propertyFilter !== "all") {
      result = result.filter((l) => l.property_id === propertyFilter);
    }
    return result;
  }, [rangeLeads, search, propertyFilter]);

  // Sort
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const valA = sortField === "name" ? a.name.toLowerCase() : a.created_at;
      const valB = sortField === "name" ? b.name.toLowerCase() : b.created_at;
      return sortDir === "asc" ? (valA < valB ? -1 : 1) : valA > valB ? -1 : 1;
    });
  }, [filtered, sortField, sortDir]);

  // Chart data — leads per day for last 30 days
  const chartData = useMemo(() => {
    const days: Record<string, number> = {};
    const chartDays = dateRange === "today" ? 1 : dateRange === "7d" ? 7 : 30;
    for (let i = chartDays - 1; i >= 0; i--) {
      const d = format(subDays(now, i), "yyyy-MM-dd");
      days[d] = 0;
    }
    rangeLeads.forEach((l) => {
      const d = l.created_at.slice(0, 10);
      if (d in days) days[d]++;
    });
    return Object.entries(days).map(([date, count]) => ({
      date: format(parseISO(date), "MMM dd"),
      leads: count,
    }));
  }, [rangeLeads, dateRange]);

  // Top properties
  const topProperties = useMemo(() => {
    const counts: Record<string, number> = {};
    rangeLeads.forEach((l) => {
      if (l.property_id) counts[l.property_id] = (counts[l.property_id] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, count]) => ({ property: propMap[id], count }));
  }, [rangeLeads, propMap]);

  const toggleSort = (field: "created_at" | "name") => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("desc"); }
  };

  const SortIcon = ({ field }: { field: string }) =>
    sortField === field ? (sortDir === "asc" ? <ChevronUp className="w-3 h-3 inline ml-1" /> : <ChevronDown className="w-3 h-3 inline ml-1" />) : null;

  const chartConfig = { leads: { label: "Leads", color: "hsl(var(--accent))" } };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-display font-semibold text-foreground">Leads</h1>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Leads", value: totalLeads, icon: MessageCircle },
            { label: "Today", value: leadsToday, icon: CalendarDays },
            { label: "This Week", value: leadsWeek, icon: TrendingUp },
            { label: "This Month", value: leadsMonth, icon: Users },
          ].map((kpi) => (
            <Card key={kpi.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-md bg-accent/10">
                  <kpi.icon className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <p className="text-xl font-bold text-foreground">{loading ? "…" : kpi.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Chart + Top Properties */}
        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Leads Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[220px] w-full">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="leads" fill="var(--color-leads)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Top Referring Properties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : topProperties.length === 0 ? (
                <p className="text-sm text-muted-foreground">No property-linked leads yet.</p>
              ) : (
                topProperties.map(({ property, count }) => (
                  <div key={property?.id || "unknown"} className="flex justify-between items-center text-sm">
                    <span className="text-foreground truncate max-w-[180px]">
                      {property ? property.reference_number || property.title : "Unknown"}
                    </span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder="Search name or email…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-56" />
          <Select value={propertyFilter} onValueChange={setPropertyFilter}>
            <SelectTrigger className="w-48"><SelectValue placeholder="All properties" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All properties</SelectItem>
              {properties.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.reference_number || p.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-3 font-medium text-muted-foreground cursor-pointer" onClick={() => toggleSort("name")}>
                      Name <SortIcon field="name" />
                    </th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Email</th>
                    <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Phone</th>
                    <th className="text-left p-3 font-medium text-muted-foreground hidden lg:table-cell">Subject</th>
                    <th className="text-left p-3 font-medium text-muted-foreground hidden lg:table-cell">Property</th>
                    <th className="text-left p-3 font-medium text-muted-foreground cursor-pointer" onClick={() => toggleSort("created_at")}>
                      Date <SortIcon field="created_at" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Loading…</td></tr>
                  ) : sorted.length === 0 ? (
                    <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No leads found.</td></tr>
                  ) : (
                    sorted.map((lead) => {
                      const prop = lead.property_id ? propMap[lead.property_id] : null;
                      const expanded = expandedRow === lead.id;
                      return (
                        <>
                          <tr
                            key={lead.id}
                            className="border-b border-border hover:bg-muted/30 cursor-pointer transition-colors"
                            onClick={() => setExpandedRow(expanded ? null : lead.id)}
                          >
                            <td className="p-3 text-foreground font-medium">{lead.name}</td>
                            <td className="p-3 text-muted-foreground">{lead.email}</td>
                            <td className="p-3 text-muted-foreground hidden md:table-cell">{lead.phone || "—"}</td>
                            <td className="p-3 text-muted-foreground hidden lg:table-cell">{lead.subject || "—"}</td>
                            <td className="p-3 text-muted-foreground hidden lg:table-cell">{prop ? prop.reference_number || prop.title : "—"}</td>
                            <td className="p-3 text-muted-foreground">{format(parseISO(lead.created_at), "MMM dd, yyyy")}</td>
                          </tr>
                          {expanded && (
                            <tr key={`${lead.id}-msg`} className="bg-muted/20">
                              <td colSpan={6} className="p-4 text-sm text-foreground whitespace-pre-wrap">
                                <span className="font-medium text-muted-foreground">Message:</span> {lead.message}
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
