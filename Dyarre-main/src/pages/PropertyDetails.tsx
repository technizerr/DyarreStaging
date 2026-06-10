import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { ScrollReveal } from "@/components/ScrollReveal";
import { SEO } from "@/components/SEO";
import { useLanguage } from "@/i18n/LanguageContext";
import { formatPriceFull } from "@/data/mockData";
import { useDbProperty } from "@/hooks/useDbProperties";
import { Bed, Bath, Maximize, MapPin, Phone, Mail, MessageCircle, ExternalLink, ChevronLeft, ChevronRight, ArrowLeft, Check } from "lucide-react";
import { useState } from "react";

export default function PropertyDetailsPage() {
  const { id } = useParams();
  const { t } = useLanguage();
  const dt = t.propertyDetails;
  const { property, isLoading } = useDbProperty(id);
  const [activeImage, setActiveImage] = useState(0);

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-6 py-20 text-center text-muted-foreground">Loading…</div>
      </Layout>
    );
  }

  if (!property) {
    return (
      <Layout>
        <SEO title="Property Not Found" description="The requested property could not be found." path={`/property/${id}`} />
        <div className="container mx-auto px-6 py-20 text-center">
          <h1 className="text-2xl font-display font-semibold">{dt.notFound}</h1>
          <Link to="/properties" className="mt-4 inline-flex items-center gap-2 text-accent text-sm">
            <ArrowLeft className="w-4 h-4" /> {dt.backToProperties}
          </Link>
        </div>
      </Layout>
    );
  }

  const whatsappMessage = encodeURIComponent(`Hi, I'm interested in this property: ${property.title}`);
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${property.whatsappNumber.replace(/[^0-9]/g, "")}&text=${whatsappMessage}`;

  return (
    <Layout>
      <SEO
        title={property.title}
        description={`${property.type} in ${property.zone}, ${property.city} — ${formatPriceFull(property.price)}. ${property.bedrooms} beds, ${property.bathrooms} baths, ${property.size} sqft.`}
        path={`/property/${property.id}`}
        type="article"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "RealEstateListing",
          name: property.title,
          description: property.description,
          url: `https://dyarre.com/property/${property.id}`,
          image: property.images[0],
          offers: { "@type": "Offer", price: property.price, priceCurrency: "AED" },
          address: { "@type": "PostalAddress", addressLocality: property.zone, addressRegion: property.city, addressCountry: "AE" },
        }}
      />

      <div className="container mx-auto px-6 lg:px-8 py-4">
        <Link to="/properties" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> {dt.backToProperties}
        </Link>
      </div>

      <section className="pb-16">
        <div className="container mx-auto px-6 lg:px-8">
          <ScrollReveal>
            <div
              className="relative rounded-lg overflow-hidden aspect-[16/9] lg:aspect-[21/9] bg-secondary mb-2 touch-pan-y select-none"
              onTouchStart={(e) => {
                const touch = e.touches[0];
                (e.currentTarget as any)._touchStartX = touch.clientX;
              }}
              onTouchEnd={(e) => {
                const startX = (e.currentTarget as any)._touchStartX;
                if (startX === undefined) return;
                const endX = e.changedTouches[0].clientX;
                const diff = startX - endX;
                if (Math.abs(diff) > 50) {
                  if (diff > 0) setActiveImage((prev) => (prev + 1) % property.images.length);
                  else setActiveImage((prev) => (prev - 1 + property.images.length) % property.images.length);
                }
              }}
            >
              <img src={property.images[activeImage]} alt={property.title} className="w-full h-full object-cover" />
              {property.images.length > 1 && (
                <>
                  <button onClick={() => setActiveImage((prev) => (prev - 1 + property.images.length) % property.images.length)} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-card transition-colors active:scale-95">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button onClick={() => setActiveImage((prev) => (prev + 1) % property.images.length)} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-card transition-colors active:scale-95">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
              {/* Image counter */}
              {property.images.length > 1 && (
                <div className="absolute bottom-4 right-4 px-3 py-1.5 text-xs font-medium bg-card/90 backdrop-blur-sm rounded text-foreground">
                  {activeImage + 1}/{property.images.length}
                </div>
              )}
              <div className="absolute top-4 left-4 flex gap-2">
                <span className="px-3 py-1.5 text-xs font-medium bg-card/90 backdrop-blur-sm rounded text-foreground">{property.status}</span>
                <span className="px-3 py-1.5 text-xs font-medium bg-accent text-accent-foreground rounded">{property.type}</span>
              </div>
            </div>
            {property.images.length > 1 && (
              <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                {property.images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImage(i)} className={`w-20 h-14 rounded overflow-hidden border-2 transition-colors shrink-0 ${i === activeImage ? "border-accent" : "border-transparent opacity-60 hover:opacity-100"}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </ScrollReveal>

          <div className="mt-8 grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <ScrollReveal>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-display font-semibold text-foreground leading-tight">{property.title}</h1>
                  <p className="mt-2 text-muted-foreground flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {property.zone}, {property.city}</p>
                  {(property as any).developer && (
                    <p className="mt-1 text-sm text-muted-foreground">Developer: <span className="text-foreground font-medium">{(property as any).developer}</span></p>
                  )}
                  <div className="mt-4 text-3xl font-display font-semibold text-foreground">{formatPriceFull(property.price)}</div>
                </div>
              </ScrollReveal>
              <ScrollReveal>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {property.bedrooms > 0 && <StatCard icon={<Bed className="w-5 h-5" />} label={dt.bedrooms} value={property.bedrooms.toString()} />}
                  {property.bathrooms > 0 && <StatCard icon={<Bath className="w-5 h-5" />} label={dt.bathrooms} value={property.bathrooms.toString()} />}
                  <StatCard icon={<Maximize className="w-5 h-5" />} label={dt.size} value={`${property.size.toLocaleString()} ${t.common.sqft}`} />
                  <StatCard icon={<Check className="w-5 h-5" />} label={dt.furnishingLabel} value={property.furnishing} />
                </div>
              </ScrollReveal>
              <ScrollReveal>
                <div>
                  <h2 className="text-lg font-display font-semibold text-foreground mb-3">{dt.description}</h2>
                  <p className="text-muted-foreground leading-relaxed">{property.description}</p>
                </div>
              </ScrollReveal>
              <ScrollReveal>
                <div>
                  <h2 className="text-lg font-display font-semibold text-foreground mb-3">{dt.features}</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {property.features.map((f) => (
                      <div key={f} className="flex items-center gap-2 text-sm text-muted-foreground"><Check className="w-4 h-4 text-accent shrink-0" /> {f}</div>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
              <ScrollReveal>
                <div>
                  <h2 className="text-lg font-display font-semibold text-foreground mb-3">{dt.locationTitle}</h2>
                  <a href={property.googleMapUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium border border-border rounded-md text-foreground hover:bg-secondary transition-colors active:scale-[0.97]">
                    <ExternalLink className="w-4 h-4" /> {dt.viewOnMap}
                  </a>
                </div>
              </ScrollReveal>
            </div>
            <div className="lg:col-span-1">
              <ScrollReveal direction="right">
                <div className="sticky top-24 bg-card rounded-lg border border-border p-6 shadow-sm space-y-4">
                  <h3 className="font-display font-semibold text-foreground text-lg">{dt.interested}</h3>
                  <p className="text-sm text-muted-foreground">{dt.interestedDesc}</p>
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-medium bg-[hsl(142_72%_34%)] text-primary-foreground rounded-md hover:opacity-90 transition-opacity active:scale-[0.97]">
                    <MessageCircle className="w-4 h-4" /> {dt.chatWhatsApp}
                  </a>
                  <a href={`tel:${property.whatsappNumber}`} className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity active:scale-[0.97]">
                    <Phone className="w-4 h-4" /> {dt.callBroker}
                  </a>
                  <a href={`mailto:dyarree@gmail.com?subject=${encodeURIComponent(`Inquiry: ${property.title}`)}`} className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-medium border border-border rounded-md text-foreground hover:bg-secondary transition-colors active:scale-[0.97]">
                    <Mail className="w-4 h-4" /> {dt.sendEmail}
                  </a>
                  <div className="pt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground">{dt.reference}: {(property as any).referenceNumber || `PRE-${String((property as any).displayId ?? property.id).padStart(5, "0")}`}</p>
                    <p className="text-xs text-muted-foreground">{dt.listed}: {new Date(property.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-2 p-4 bg-secondary/50 rounded-md text-center">
      <div className="text-accent">{icon}</div>
      <div className="text-sm font-medium text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
