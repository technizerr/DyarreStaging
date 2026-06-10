import { Layout } from "@/components/Layout";
import { ScrollReveal } from "@/components/ScrollReveal";
import { SEO } from "@/components/SEO";
import { useLanguage } from "@/i18n/LanguageContext";
import { SocialIcons } from "@/components/SocialIcons";
import { Phone, Mail, MapPin, MessageCircle, Send } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { toast } from "sonner";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be under 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be under 255 characters"),
  phone: z.string().max(20, "Phone must be under 20 characters").optional().or(z.literal("")),
  message: z.string().trim().min(1, "Message is required").max(2000, "Message must be under 2000 characters"),
});

export default function ContactPage() {
  const { t } = useLanguage();
  const ct = t.contact;
  const [formState, setFormState] = useState({ name: "", email: "", phone: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = contactSchema.safeParse(formState);
    if (!result.success) {
      toast.error(result.error.errors[0]?.message || "Invalid input");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("contact_submissions").insert({
        name: result.data.name,
        email: result.data.email,
        phone: result.data.phone || null,
        message: result.data.message,
      });
      if (error) throw error;
      toast.success("Message sent successfully!");
      setFormState({ name: "", email: "", phone: "", message: "" });
    } catch {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <SEO title="Contact Us" description="Contact dyarre for property inquiries, viewings, or to list your property. Call, email, or WhatsApp us." path="/contact" />
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center max-w-xl mx-auto mb-12">
              <span className="text-xs font-medium uppercase tracking-widest text-accent">{ct.eyebrow}</span>
              <h1 className="mt-3 text-3xl lg:text-4xl font-display font-semibold text-foreground leading-tight">{ct.title}</h1>
              <p className="mt-3 text-muted-foreground">{ct.subtitle}</p>
            </div>
          </ScrollReveal>
          <div className="grid lg:grid-cols-5 gap-12 max-w-5xl mx-auto">
            <div className="lg:col-span-3">
              <ScrollReveal direction="left">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-2">{ct.fullName}</label>
                      <input type="text" required maxLength={100} value={formState.name} onChange={(e) => setFormState((s) => ({ ...s, name: e.target.value }))} className="w-full px-4 py-3 text-sm rounded-md bg-secondary border-0 focus:ring-2 focus:ring-accent/40 outline-none" placeholder={ct.namePlaceholder} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-2">{ct.email}</label>
                      <input type="email" required maxLength={255} value={formState.email} onChange={(e) => setFormState((s) => ({ ...s, email: e.target.value }))} className="w-full px-4 py-3 text-sm rounded-md bg-secondary border-0 focus:ring-2 focus:ring-accent/40 outline-none" placeholder={ct.emailPlaceholder} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-2">{ct.phone}</label>
                    <input type="tel" maxLength={20} value={formState.phone} onChange={(e) => setFormState((s) => ({ ...s, phone: e.target.value }))} className="w-full px-4 py-3 text-sm rounded-md bg-secondary border-0 focus:ring-2 focus:ring-accent/40 outline-none" placeholder={ct.phonePlaceholder} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-2">{ct.message}</label>
                    <textarea required maxLength={2000} rows={5} value={formState.message} onChange={(e) => setFormState((s) => ({ ...s, message: e.target.value }))} className="w-full px-4 py-3 text-sm rounded-md bg-secondary border-0 focus:ring-2 focus:ring-accent/40 outline-none resize-none" placeholder={ct.messagePlaceholder} />
                  </div>
                  <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity active:scale-[0.97] disabled:opacity-50">
                    <Send className="w-4 h-4" /> {submitting ? "Sending…" : ct.send}
                  </button>
                </form>
              </ScrollReveal>
            </div>
            <div className="lg:col-span-2">
              <ScrollReveal direction="right">
                <div className="bg-card rounded-lg border border-border p-8 space-y-6">
                  <h3 className="font-display font-semibold text-foreground text-lg">{ct.contactInfo}</h3>
                  <div className="space-y-5">
                    <a href="tel:+971544444518" className="flex items-start gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                      <Phone className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                      <div><span className="block font-medium text-foreground">{ct.phoneLabel}</span>+971 54 444 4518</div>
                    </a>
                    <a href="mailto:dyarree@gmail.com" className="flex items-start gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                      <Mail className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                      <div><span className="block font-medium text-foreground">{ct.emailLabel}</span>dyarree@gmail.com</div>
                    </a>
                    <div className="flex items-start gap-3 text-sm text-muted-foreground">
                      <MapPin className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                      <div><span className="block font-medium text-foreground">{ct.officeLabel}</span>Abu Dhabi, UAE</div>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-border">
                    <a href="https://api.whatsapp.com/send?phone=971544444518&text=Hi%2C%20I%20have%20a%20question" target="_blank" rel="noopener noreferrer" className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-medium bg-[hsl(142_72%_34%)] text-primary-foreground rounded-md hover:opacity-90 transition-opacity active:scale-[0.97]">
                      <MessageCircle className="w-4 h-4" /> {ct.chatWhatsApp}
                    </a>
                  </div>
                  <SocialIcons className="pt-4 border-t border-border" />
                  <div className="pt-4 border-t border-border">
                    <div className="rounded-md overflow-hidden aspect-video bg-secondary">
                      <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3610.178!2d55.2708!3d25.1972!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f43348a67e24b%3A0xff45e502e1ceb7e2!2sDowntown%20Dubai!5e0!3m2!1sen!2sae!4v1234567890" width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Office location" />
                    </div>
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
