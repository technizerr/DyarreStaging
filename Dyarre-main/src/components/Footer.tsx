import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, MessageCircle, Instagram } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

import { useBrandingLogos } from "@/hooks/useBrandingLogos";
import { useSocialLinks } from "@/hooks/useSocialLinks";

export function Footer() {
  const { t } = useLanguage();
  const logos = useBrandingLogos();
  const { links: social } = useSocialLinks();
  const instagramHandle = social.instagram ? social.instagram.replace(/\/+$/, "").split("/").pop() : "";

  return (
    <footer className="bg-foreground text-primary-foreground">
      <div className="container mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div className="lg:col-span-1">
            <img
              src={logos.logo_dark_bg_url}
              alt="Dyarre Abu Dhabi"
              className="h-20 w-auto object-contain"
            />
            <p className="mt-4 text-sm leading-relaxed opacity-70">{t.footer.tagline}</p>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-4 opacity-60">{t.footer.quickLinks}</h4>
            <div className="flex flex-col gap-3">
              <Link to="/" className="text-sm opacity-70 hover:opacity-100 transition-opacity">{t.nav.home}</Link>
              <Link to="/properties" className="text-sm opacity-70 hover:opacity-100 transition-opacity">{t.nav.properties}</Link>
              <Link to="/mortgage-calculator" className="text-sm opacity-70 hover:opacity-100 transition-opacity">{t.nav.mortgage}</Link>
              <Link to="/about" className="text-sm opacity-70 hover:opacity-100 transition-opacity">{t.nav.about}</Link>
              <Link to="/contact" className="text-sm opacity-70 hover:opacity-100 transition-opacity">{t.nav.contact}</Link>
              
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-4 opacity-60">{t.footer.propertyTypes}</h4>
            <div className="flex flex-col gap-3">
              <Link to="/properties?type=Villa" className="text-sm opacity-70 hover:opacity-100 transition-opacity">{t.categories.villas}</Link>
              <Link to="/properties?type=Apartment" className="text-sm opacity-70 hover:opacity-100 transition-opacity">{t.categories.apartments}</Link>
              <Link to="/properties?type=Townhouse" className="text-sm opacity-70 hover:opacity-100 transition-opacity">{t.categories.townhouses}</Link>
              <Link to="/properties?type=Land" className="text-sm opacity-70 hover:opacity-100 transition-opacity">{t.categories.land}</Link>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-4 opacity-60">{t.footer.contactTitle}</h4>
            <div className="flex flex-col gap-3">
              <a href="tel:+971544444518" className="inline-flex items-center gap-2 text-sm opacity-70 hover:opacity-100 transition-opacity">
                <Phone className="w-4 h-4" /> +971 54 444 4518
              </a>
              <a href="https://api.whatsapp.com/send?phone=971544444518&text=Hi%2C%20I%20have%20a%20question" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm opacity-70 hover:opacity-100 transition-opacity">
                <MessageCircle className="w-4 h-4" /> +971 54 444 4518
              </a>
              <a href="mailto:dyarree@gmail.com" className="inline-flex items-center gap-2 text-sm opacity-70 hover:opacity-100 transition-opacity">
                <Mail className="w-4 h-4" /> dyarree@gmail.com
              </a>
              <span className="inline-flex items-center gap-2 text-sm opacity-70">
                <MapPin className="w-4 h-4 shrink-0" /> Abu Dhabi, UAE
              </span>
              {social.instagram && (
                <a href={social.instagram} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm opacity-70 hover:opacity-100 transition-opacity">
                  <Instagram className="w-4 h-4" /> @{instagramHandle}
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-primary-foreground/10 text-center">
          <p className="text-xs opacity-50">© {new Date().getFullYear()} {t.footer.copyright}</p>
        </div>
      </div>
    </footer>
  );
}
