import { AdminLayout } from "./AdminLayout";
import { Building2, Users, Eye, TrendingUp } from "lucide-react";
import { properties } from "@/data/mockData";

export default function AdminDashboard() {
  const totalProperties = properties.length;
  const visibleProperties = properties.filter((p) => p.isVisible).length;
  const forSale = properties.filter((p) => p.status === "For Sale").length;
  const forRent = properties.filter((p) => p.status === "For Rent").length;

  const stats = [
    { label: "Total Properties", value: totalProperties, icon: Building2, color: "text-accent" },
    { label: "Published", value: visibleProperties, icon: Eye, color: "text-green-600" },
    { label: "For Sale", value: forSale, icon: TrendingUp, color: "text-blue-600" },
    { label: "For Rent", value: forRent, icon: Users, color: "text-orange-600" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-display font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Overview of your real estate portfolio</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-card rounded-lg border border-border p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</span>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className="mt-2 text-2xl font-display font-semibold text-foreground">{stat.value}</div>
            </div>
          ))}
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="font-display font-semibold text-foreground mb-4">Recent Properties</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-3 font-medium text-muted-foreground">Title</th>
                  <th className="pb-3 font-medium text-muted-foreground">Type</th>
                  <th className="pb-3 font-medium text-muted-foreground">Status</th>
                  <th className="pb-3 font-medium text-muted-foreground">Price</th>
                  <th className="pb-3 font-medium text-muted-foreground">Visible</th>
                </tr>
              </thead>
              <tbody>
                {properties.slice(0, 5).map((p) => (
                  <tr key={p.id} className="border-b border-border/50">
                    <td className="py-3 font-medium text-foreground">{p.title}</td>
                    <td className="py-3 text-muted-foreground">{p.type}</td>
                    <td className="py-3"><span className="px-2 py-0.5 text-xs rounded bg-secondary text-foreground">{p.status}</span></td>
                    <td className="py-3 text-muted-foreground">AED {p.price.toLocaleString()}</td>
                    <td className="py-3">{p.isVisible ? <span className="text-green-600">●</span> : <span className="text-muted-foreground">○</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
