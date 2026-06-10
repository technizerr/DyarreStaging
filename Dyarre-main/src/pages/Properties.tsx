import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { PropertyCard } from "@/components/PropertyCard";
import { ScrollReveal } from "@/components/ScrollReveal";
import { SEO } from "@/components/SEO";
import { useLanguage } from "@/i18n/LanguageContext";
import { filterOptions, cityZones, type UAECity } from "@/data/mockData";
import { useDbProperties } from "@/hooks/useDbProperties";
import { Grid3X3, List, SlidersHorizontal, X } from "lucide-react";

type SortOption = "newest" | "price-asc" | "price-desc";

export default function PropertiesPage() {
  const { t } = useLanguage();
  const pt = t.propertiesPage;
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState<SortOption>("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: searchParams.get("type") || "",
    city: searchParams.get("city") || "",
    zone: searchParams.get("zone") || searchParams.get("area") || "",
    status: searchParams.get("status") || "",
    bedrooms: searchParams.get("bedrooms") || "",
    priceMin: "", priceMax: "", furnishing: "",
  });

  const updateFilter = (key: string, value: string) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      // Reset zone when city changes
      if (key === "city") next.zone = "";
      return next;
    });
  };

  const clearFilters = () => {
    setFilters({ type: "", city: "", zone: "", status: "", bedrooms: "", priceMin: "", priceMax: "", furnishing: "" });
    setSearchParams({});
  };

  const availableZones = filters.city
    ? cityZones[filters.city as UAECity] || []
    : filterOptions.areas;

  const { data: properties = [], isLoading } = useDbProperties();

  const filteredProperties = useMemo(() => {
    let result = properties.filter((p) => p.isVisible);
    if (filters.type) result = result.filter((p) => p.type === filters.type);
    if (filters.city) result = result.filter((p) => p.city === filters.city);
    if (filters.zone) result = result.filter((p) => p.zone === filters.zone);
    if (filters.status) result = result.filter((p) => p.status === filters.status);
    if (filters.bedrooms) result = result.filter((p) => p.bedrooms === Number(filters.bedrooms));
    if (filters.priceMin) result = result.filter((p) => p.price >= Number(filters.priceMin));
    if (filters.priceMax) result = result.filter((p) => p.price <= Number(filters.priceMax));
    if (filters.furnishing) result = result.filter((p) => p.furnishing === filters.furnishing);
    switch (sort) {
      case "price-asc": result.sort((a, b) => a.price - b.price); break;
      case "price-desc": result.sort((a, b) => b.price - a.price); break;
      case "newest": result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
    }
    return result;
  }, [filters, sort, properties]);

  const hasActiveFilters = Object.values(filters).some(Boolean);

  const FilterPanel = () => (
    <>
      <FilterSelect label={pt.propertyType} value={filters.type} onChange={(v) => updateFilter("type", v)} options={filterOptions.types} allLabel={pt.all} />
      <FilterSelect label="City" value={filters.city} onChange={(v) => updateFilter("city", v)} options={filterOptions.cities} allLabel={pt.all} />
      <FilterSelect label={pt.locationLabel} value={filters.zone} onChange={(v) => updateFilter("zone", v)} options={availableZones} allLabel={pt.all} />
      <FilterSelect label={pt.statusLabel} value={filters.status} onChange={(v) => updateFilter("status", v)} options={filterOptions.statuses} allLabel={pt.all} />
      <FilterSelect label={pt.bedrooms} value={filters.bedrooms} onChange={(v) => updateFilter("bedrooms", v)} options={filterOptions.bedrooms.map(String)} allLabel={pt.all} studioLabel={pt.studio} />
      <FilterSelect label={pt.furnishing} value={filters.furnishing} onChange={(v) => updateFilter("furnishing", v)} options={filterOptions.furnishing} allLabel={pt.all} />
    </>
  );

  return (
    <Layout>
      <SEO title="Properties" description="Browse premium properties for sale and rent across the UAE — villas, apartments, townhouses, land, and off-plan developments." path="/properties" />
      <section className="py-12 lg:py-16">
        <div className="container mx-auto px-6 lg:px-8">
          <ScrollReveal>
            <div className="mb-8">
              <h1 className="text-3xl lg:text-4xl font-display font-semibold text-foreground">{pt.title}</h1>
              <p className="mt-2 text-muted-foreground">{filteredProperties.length} {pt.propertiesFound}</p>
            </div>
          </ScrollReveal>
          <div className="flex flex-col lg:flex-row gap-8">
            <aside className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-24 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">{pt.filters}</h3>
                  {hasActiveFilters && <button onClick={clearFilters} className="text-xs text-accent hover:text-foreground transition-colors">{pt.clearAll}</button>}
                </div>
                <FilterPanel />
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-2">{pt.priceRange}</label>
                  <div className="flex gap-2">
                    <input type="number" placeholder={pt.min} value={filters.priceMin} onChange={(e) => updateFilter("priceMin", e.target.value)} className="w-full px-3 py-2 text-sm rounded-md bg-secondary border-0 focus:ring-2 focus:ring-accent/40 outline-none" />
                    <input type="number" placeholder={pt.max} value={filters.priceMax} onChange={(e) => updateFilter("priceMax", e.target.value)} className="w-full px-3 py-2 text-sm rounded-md bg-secondary border-0 focus:ring-2 focus:ring-accent/40 outline-none" />
                  </div>
                </div>
              </div>
            </aside>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-6">
                <button onClick={() => setShowFilters(true)} className="lg:hidden inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-border rounded-md text-foreground active:scale-[0.97]">
                  <SlidersHorizontal className="w-4 h-4" /> {pt.filters}
                  {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-accent" />}
                </button>
                <div className="flex items-center gap-3">
                  <select value={sort} onChange={(e) => setSort(e.target.value as SortOption)} className="px-3 py-2 text-sm rounded-md bg-secondary border-0 focus:ring-2 focus:ring-accent/40 outline-none">
                    <option value="newest">{pt.newest}</option>
                    <option value="price-asc">{pt.priceLowHigh}</option>
                    <option value="price-desc">{pt.priceHighLow}</option>
                  </select>
                  <div className="hidden sm:flex border border-border rounded-md overflow-hidden">
                    <button onClick={() => setView("grid")} className={`p-2 ${view === "grid" ? "bg-secondary text-foreground" : "text-muted-foreground"}`}><Grid3X3 className="w-4 h-4" /></button>
                    <button onClick={() => setView("list")} className={`p-2 ${view === "list" ? "bg-secondary text-foreground" : "text-muted-foreground"}`}><List className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
              {filteredProperties.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-lg font-display text-foreground">{pt.noResults}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{pt.noResultsHint}</p>
                  <button onClick={clearFilters} className="mt-4 px-5 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-md active:scale-[0.97]">{pt.clearFilters}</button>
                </div>
              ) : view === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">{filteredProperties.map((p) => <PropertyCard key={p.id} property={p} variant="grid" />)}</div>
              ) : (
                <div className="flex flex-col gap-4">{filteredProperties.map((p) => <PropertyCard key={p.id} property={p} variant="list" />)}</div>
              )}
            </div>
          </div>
          {showFilters && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-foreground/40" onClick={() => setShowFilters(false)} />
              <div className="absolute right-0 top-0 bottom-0 w-80 bg-card p-6 overflow-y-auto animate-slide-right">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wider">{pt.filters}</h3>
                  <button onClick={() => setShowFilters(false)} className="p-1"><X className="w-5 h-5" /></button>
                </div>
                <div className="space-y-6">
                  <FilterPanel />
                </div>
                <div className="mt-8 flex gap-3">
                  <button onClick={clearFilters} className="flex-1 px-4 py-2.5 text-sm border border-border rounded-md">{pt.clear}</button>
                  <button onClick={() => setShowFilters(false)} className="flex-1 px-4 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-md">{pt.apply}</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}

function FilterSelect({ label, value, onChange, options, allLabel = "All", studioLabel }: { label: string; value: string; onChange: (v: string) => void; options: string[]; allLabel?: string; studioLabel?: string }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-2">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2.5 text-sm rounded-md bg-secondary border-0 focus:ring-2 focus:ring-accent/40 outline-none">
        <option value="">{allLabel}</option>
        {options.map((opt) => <option key={opt} value={opt}>{opt === "0" && studioLabel ? studioLabel : opt}</option>)}
      </select>
    </div>
  );
}
