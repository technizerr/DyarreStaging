import { Link } from "react-router-dom";
import { Search, ArrowRight, MapPin, Building2, Home as HomeIcon, Landmark, TreePalm } from "lucide-react";
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { PropertyCard } from "@/components/PropertyCard";
import { ScrollReveal } from "@/components/ScrollReveal";
import { SEO } from "@/components/SEO";
import { useLanguage } from "@/i18n/LanguageContext";
import { offPlanProjects, filterOptions, formatPrice, cityZones, type UAECity } from "@/data/mockData";
import { useDbProperties } from "@/hooks/useDbProperties";
import heroImage from "@/assets/hero-villa.jpg";

export default function HomePage() {
  const { t } = useLanguage();
  const [searchType, setSearchType] = useState("");
  const [searchCity, setSearchCity] = useState("");
  const [searchZone, setSearchZone] = useState("");
  const [searchStatus, setSearchStatus] = useState("");

  const { data: allProperties = [] } = useDbProperties();
  const featuredProperties = allProperties.slice(0, 4);

  const availableZones = searchCity
    ? cityZones[searchCity as UAECity] || []
    : filterOptions.areas;

  const typeIcons: Record<string, React.ReactNode> = {
    Villa: <TreePalm className="w-5 h-5" />,
    Apartment: <Building2 className="w-5 h-5" />,
    Townhouse: <HomeIcon className="w-5 h-5" />,
    Land: <Landmark className="w-5 h-5" />,
  };

  return (
    <Layout>
      <SEO
        title="Home"
        description="Discover premium villas, apartments, townhouses, and off-plan developments in the UAE. dyarre — your trusted luxury real estate partner."
        path="/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "RealEstateAgent",
          name: "dyarre",
          url: "https://dyarre.com",
          description: "Premium real estate brokerage in the UAE",
          address: { "@type": "PostalAddress", addressLocality: "Abu Dhabi", addressCountry: "AE" },
          telephone: "+971544444518",
        }}
      />

      {/* Hero */}
      <section className="relative h-[85vh] min-h-[600px] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImage} alt="Luxury villa oceanfront" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-[hsl(var(--hero-overlay))]/55" />
        </div>
        <div className="relative container mx-auto px-6 lg:px-8">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-semibold leading-[1.1] text-primary-foreground animate-reveal-up">
              {t.hero.title1}
              <br />
              {t.hero.title2}
            </h1>
            <p className="mt-5 text-base md:text-lg text-primary-foreground/75 max-w-lg animate-reveal-up" style={{ animationDelay: "120ms" }}>
              {t.hero.subtitle}
            </p>
          </div>

          <div className="mt-10 max-w-4xl animate-reveal-up" style={{ animationDelay: "240ms" }}>
            <div className="bg-card/95 backdrop-blur-sm rounded-lg p-4 shadow-xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <select value={searchType} onChange={(e) => setSearchType(e.target.value)} className="w-full px-4 py-3 rounded-md bg-secondary text-foreground text-sm border-0 focus:ring-2 focus:ring-accent/40 outline-none">
                  <option value="">{t.hero.propertyType}</option>
                  {filterOptions.types.map((tp) => <option key={tp} value={tp}>{tp}</option>)}
                </select>
                <select value={searchCity} onChange={(e) => { setSearchCity(e.target.value); setSearchZone(""); }} className="w-full px-4 py-3 rounded-md bg-secondary text-foreground text-sm border-0 focus:ring-2 focus:ring-accent/40 outline-none">
                  <option value="">City</option>
                  {filterOptions.cities.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={searchZone} onChange={(e) => setSearchZone(e.target.value)} className="w-full px-4 py-3 rounded-md bg-secondary text-foreground text-sm border-0 focus:ring-2 focus:ring-accent/40 outline-none">
                  <option value="">{t.hero.location}</option>
                  {availableZones.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
                <select value={searchStatus} onChange={(e) => setSearchStatus(e.target.value)} className="w-full px-4 py-3 rounded-md bg-secondary text-foreground text-sm border-0 focus:ring-2 focus:ring-accent/40 outline-none">
                  <option value="">{t.hero.status}</option>
                  {filterOptions.statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <Link to={`/properties?type=${searchType}&city=${searchCity}&zone=${searchZone}&status=${searchStatus}`} className="mt-3 w-full inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity active:scale-[0.97]">
                <Search className="w-4 h-4" />
                {t.hero.searchBtn}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Property Types */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center max-w-xl mx-auto mb-12">
              <span className="text-xs font-medium uppercase tracking-widest text-accent">{t.categories.eyebrow}</span>
              <h2 className="mt-3 text-3xl lg:text-4xl font-display font-semibold text-foreground leading-tight">{t.categories.title}</h2>
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(["Villa", "Apartment", "Townhouse", "Land"] as const).map((type, i) => (
              <ScrollReveal key={type} delay={i * 80}>
                <Link to={`/properties?type=${type}`} className="group flex flex-col items-center gap-3 p-8 bg-card rounded-md border border-border hover:border-accent/30 hover:shadow-md transition-all duration-300 active:scale-[0.97]">
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-accent-foreground transition-colors duration-300">
                    {typeIcons[type]}
                  </div>
                  <span className="text-sm font-medium text-foreground">{type}s</span>
                  <span className="text-xs text-muted-foreground">{allProperties.filter((p) => p.type === type).length} {t.categories.listings}</span>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="py-20 lg:py-28 bg-secondary/50">
        <div className="container mx-auto px-6 lg:px-8">
          <ScrollReveal>
            <div className="flex items-end justify-between mb-12">
              <div>
                <span className="text-xs font-medium uppercase tracking-widest text-accent">{t.featured.eyebrow}</span>
                <h2 className="mt-3 text-3xl lg:text-4xl font-display font-semibold text-foreground leading-tight">{t.featured.title}</h2>
              </div>
              <Link to="/properties" className="hidden md:inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-foreground transition-colors">
                {t.featured.viewAll} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProperties.map((property, i) => (
              <ScrollReveal key={property.id} delay={i * 100}>
                <PropertyCard property={property} />
              </ScrollReveal>
            ))}
          </div>
          <div className="mt-8 text-center md:hidden">
            <Link to="/properties" className="inline-flex items-center gap-1.5 text-sm font-medium text-accent">
              {t.featured.viewAllProperties} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Off-Plan */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center max-w-xl mx-auto mb-12">
              <span className="text-xs font-medium uppercase tracking-widest text-accent">{t.offplan.eyebrow}</span>
              <h2 className="mt-3 text-3xl lg:text-4xl font-display font-semibold text-foreground leading-tight">{t.offplan.title}</h2>
              <p className="mt-3 text-muted-foreground">{t.offplan.subtitle}</p>
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {offPlanProjects.map((project, i) => (
              <ScrollReveal key={project.id} delay={i * 100}>
                <div className="group bg-card rounded-md overflow-hidden border border-border shadow-sm hover:shadow-lg transition-shadow duration-300">
                  <div className="aspect-[16/10] overflow-hidden">
                    <img src={project.image} alt={project.title} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" loading="lazy" />
                  </div>
                  <div className="p-5">
                    <span className="text-xs font-medium uppercase tracking-wider text-accent">{project.developer}</span>
                    <h3 className="mt-1 text-lg font-display font-semibold text-foreground">{project.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {project.location}</p>
                    <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        <span className="block text-xs text-muted-foreground/70">{t.offplan.from}</span>
                        <span className="font-display font-semibold text-foreground">{formatPrice(project.priceFrom)}</span>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <span className="block text-xs text-muted-foreground/70">{t.offplan.completion}</span>
                        <span className="font-medium text-foreground">{project.completion}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-28 bg-primary">
        <div className="container mx-auto px-6 lg:px-8">
          <ScrollReveal>
            <div className="grid md:grid-cols-2 gap-8 lg:gap-16 items-center">
              <div>
                <h2 className="text-3xl lg:text-4xl font-display font-semibold text-primary-foreground leading-tight">
                  {t.cta.title1}<br />{t.cta.title2}
                </h2>
                <p className="mt-4 text-primary-foreground/70 max-w-md">{t.cta.subtitle}</p>
                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                  <Link to="/contact" className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium bg-card text-foreground rounded-md hover:opacity-90 transition-opacity active:scale-[0.97]">
                    {t.cta.listProperty}
                  </Link>
                  <a href="https://api.whatsapp.com/send?phone=971544444518&text=Hi%2C%20I%20would%20like%20to%20list%20my%20property" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium border border-primary-foreground/25 text-primary-foreground rounded-md hover:bg-primary-foreground/10 transition-colors active:scale-[0.97]">
                    {t.cta.chatWhatsApp}
                  </a>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6 text-primary-foreground">
                {[
                  { value: "350+", label: t.cta.propertiesListed },
                  { value: "12", label: t.cta.yearsExperience },
                  { value: "98%", label: t.cta.clientSatisfaction },
                  { value: "AED 2B+", label: t.cta.totalSalesVolume },
                ].map((stat) => (
                  <div key={stat.label} className="text-center p-6">
                    <div className="text-2xl lg:text-3xl font-display font-semibold">{stat.value}</div>
                    <div className="mt-1 text-xs uppercase tracking-wider opacity-60">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </Layout>
  );
}
