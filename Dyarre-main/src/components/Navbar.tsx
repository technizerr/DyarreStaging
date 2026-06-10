import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { Menu, X, Phone, Globe } from "lucide-react";
import { useLanguage, type Language } from "@/i18n/LanguageContext";
import { useBrandingLogos } from "@/hooks/useBrandingLogos";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const location = useLocation();
  const { language, setLanguage, t, languageLabels } = useLanguage();
  const logos = useBrandingLogos();

  const navLinks = [
    { href: "/properties", label: t.nav.properties },
    { href: "/mortgage-calculator", label: t.nav.mortgage },
    { href: "/about", label: t.nav.about },
    { href: "/contact", label: t.nav.contact },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-md border-b border-border/50">
      <nav className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 h-16 lg:h-20">
          {/* Left: Logo (links home) */}
          <Link to="/" className="flex items-center" aria-label="Dyarre Abu Dhabi — Home">
            <img
              src={logos.logo_light_bg_url}
              alt="Dyarre Abu Dhabi"
              className="h-10 lg:h-12 w-auto object-contain"
            />
          </Link>

          {/* Center: Brand name (links home) */}
          <Link
            to="/"
            className="flex items-center justify-center"
            aria-label="Dyarre — Home"
          >
            <span className="font-display text-lg lg:text-2xl font-semibold tracking-[0.2em] uppercase text-foreground hover:text-accent transition-colors">
              DYARRE
            </span>
          </Link>

          {/* Right: Nav + Actions */}
          <div className="flex items-center justify-end gap-2 lg:gap-4">
            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-5">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`text-sm font-medium tracking-wide transition-colors duration-200 whitespace-nowrap ${
                    location.pathname === link.href ? "text-accent" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Language Switcher */}
            <div className="hidden md:flex relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-md hover:bg-secondary transition-colors"
              >
                <Globe className="w-4 h-4" />
                {languageLabels[language]}
              </button>
              {langOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setLangOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 z-20 bg-card border border-border rounded-md shadow-lg py-1 min-w-[120px]">
                    {(Object.keys(languageLabels) as Language[]).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => { setLanguage(lang); setLangOpen(false); }}
                        className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                          language === lang ? "text-accent font-medium bg-secondary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                        }`}
                      >
                        {languageLabels[lang]}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <a
              href="tel:+971544444518"
              className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity active:scale-[0.97]"
            >
              <Phone className="w-4 h-4" />
              {t.nav.callUs}
            </a>

            {/* Mobile toggle */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden p-2 text-foreground active:scale-95"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <div className="lg:hidden pb-6 animate-fade-in">
            <div className="flex flex-col gap-4 pt-4 border-t border-border">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`text-sm font-medium py-2 ${
                    location.pathname === link.href ? "text-accent" : "text-muted-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {/* Mobile language switcher */}
              <div className="flex gap-2 pt-2">
                {(Object.keys(languageLabels) as Language[]).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => { setLanguage(lang); setIsOpen(false); }}
                    className={`px-3 py-1.5 text-xs rounded-md border ${
                      language === lang ? "border-accent text-accent bg-accent/5" : "border-border text-muted-foreground"
                    }`}
                  >
                    {languageLabels[lang]}
                  </button>
                ))}
              </div>

              <a
                href="tel:+971544444518"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-md mt-2"
              >
                <Phone className="w-4 h-4" />
                {t.nav.callUs}
              </a>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
