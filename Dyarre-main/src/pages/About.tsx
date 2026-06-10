import { Layout } from "@/components/Layout";
import { ScrollReveal } from "@/components/ScrollReveal";
import { SEO } from "@/components/SEO";
import { useLanguage } from "@/i18n/LanguageContext";
import teamPhoto from "@/assets/team-photo.jpg";
import { Shield, Award, Users, TrendingUp } from "lucide-react";

export default function AboutPage() {
  const { t } = useLanguage();
  const at = t.about;

  const values = [
    { icon: <Shield className="w-6 h-6" />, ...at.values.licensed },
    { icon: <Award className="w-6 h-6" />, ...at.values.award },
    { icon: <Users className="w-6 h-6" />, ...at.values.expert },
    { icon: <TrendingUp className="w-6 h-6" />, ...at.values.market },
  ];

  return (
    <Layout>
      <SEO title="About Us" description="Learn about dyarre — over a decade of excellence in UAE luxury real estate. Licensed, award-winning, and trusted." path="/about" />

      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <ScrollReveal direction="left">
              <div>
                <span className="text-xs font-medium uppercase tracking-widest text-accent">{at.eyebrow}</span>
                <h1 className="mt-3 text-3xl lg:text-4xl font-display font-semibold text-foreground leading-tight">{at.title}</h1>
                <p className="mt-5 text-muted-foreground leading-relaxed">{at.p1}</p>
                <p className="mt-4 text-muted-foreground leading-relaxed">{at.p2}</p>
              </div>
            </ScrollReveal>
            <ScrollReveal direction="right">
              <div className="rounded-lg overflow-hidden aspect-[4/3]">
                <img src={teamPhoto} alt="dyarre team" className="w-full h-full object-cover" />
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24 bg-secondary/50">
        <div className="container mx-auto px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center max-w-xl mx-auto mb-12">
              <span className="text-xs font-medium uppercase tracking-widest text-accent">{at.whyEyebrow}</span>
              <h2 className="mt-3 text-3xl lg:text-4xl font-display font-semibold text-foreground leading-tight">{at.whyTitle}</h2>
            </div>
          </ScrollReveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((item, i) => (
              <ScrollReveal key={item.title} delay={i * 100}>
                <div className="bg-card p-8 rounded-md border border-border text-center">
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-accent mx-auto">{item.icon}</div>
                  <h3 className="mt-4 font-display font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-6 lg:px-8 max-w-3xl text-center">
          <ScrollReveal>
            <span className="text-xs font-medium uppercase tracking-widest text-accent">{at.missionEyebrow}</span>
            <h2 className="mt-3 text-3xl lg:text-4xl font-display font-semibold text-foreground leading-tight">{at.missionTitle}</h2>
            <p className="mt-6 text-muted-foreground leading-relaxed text-lg">{at.missionDesc}</p>
          </ScrollReveal>
        </div>
      </section>
    </Layout>
  );
}
