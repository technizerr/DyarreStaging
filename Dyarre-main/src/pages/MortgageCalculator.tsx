import { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { ScrollReveal } from "@/components/ScrollReveal";
import { SEO } from "@/components/SEO";
import { useLanguage } from "@/i18n/LanguageContext";
import { Calculator, PieChart } from "lucide-react";

export default function MortgageCalculatorPage() {
  const { t } = useLanguage();
  const mt = t.mortgage;

  const [price, setPrice] = useState(2000000);
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [termYears, setTermYears] = useState(25);
  const [rate, setRate] = useState(4.5);

  const result = useMemo(() => {
    const loanAmount = price * (1 - downPaymentPercent / 100);
    const monthlyRate = rate / 100 / 12;
    const numPayments = termYears * 12;

    if (monthlyRate === 0) {
      const monthly = loanAmount / numPayments;
      return { monthlyPayment: monthly, totalPayment: loanAmount, totalInterest: 0, loanAmount };
    }

    const monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
    const totalPayment = monthlyPayment * numPayments;
    const totalInterest = totalPayment - loanAmount;

    return { monthlyPayment, totalPayment, totalInterest, loanAmount };
  }, [price, downPaymentPercent, termYears, rate]);

  const principalPercent = result.loanAmount > 0 ? (result.loanAmount / result.totalPayment) * 100 : 0;
  const interestPercent = 100 - principalPercent;

  const fmt = (n: number) => `AED ${Math.round(n).toLocaleString()}`;

  return (
    <Layout>
      <SEO
        title="Mortgage Calculator"
        description="Calculate your monthly mortgage payments for properties in the UAE. Estimate loan amounts, interest rates, and payment schedules."
        path="/mortgage-calculator"
      />
      <section className="py-12 lg:py-20">
        <div className="container mx-auto px-6 lg:px-8 max-w-4xl">
          <ScrollReveal>
            <div className="text-center mb-12">
              <span className="text-xs font-medium uppercase tracking-widest text-accent">
                <Calculator className="w-4 h-4 inline-block mr-1" />
                {mt.title}
              </span>
              <h1 className="mt-3 text-3xl lg:text-4xl font-display font-semibold text-foreground leading-tight">
                {mt.title}
              </h1>
              <p className="mt-3 text-muted-foreground">{mt.subtitle}</p>
            </div>
          </ScrollReveal>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Inputs */}
            <ScrollReveal direction="left">
              <div className="bg-card rounded-lg border border-border p-6 space-y-6">
                <InputSlider
                  label={mt.propertyPrice}
                  value={price}
                  onChange={setPrice}
                  min={100000}
                  max={100000000}
                  step={50000}
                  format={fmt}
                />
                <InputSlider
                  label={mt.downPayment}
                  value={downPaymentPercent}
                  onChange={setDownPaymentPercent}
                  min={5}
                  max={80}
                  step={1}
                  format={(v) => `${v}%`}
                />
                <InputSlider
                  label={mt.loanTerm}
                  value={termYears}
                  onChange={setTermYears}
                  min={1}
                  max={30}
                  step={1}
                  format={(v) => `${v} years`}
                />
                <InputSlider
                  label={mt.interestRate}
                  value={rate}
                  onChange={setRate}
                  min={0.5}
                  max={15}
                  step={0.1}
                  format={(v) => `${v}%`}
                />
              </div>
            </ScrollReveal>

            {/* Results */}
            <ScrollReveal direction="right">
              <div className="bg-card rounded-lg border border-border p-6 space-y-6">
                <h3 className="font-display font-semibold text-foreground text-lg flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-accent" />
                  {mt.results}
                </h3>

                {/* Visual breakdown */}
                <div className="space-y-3">
                  <div className="h-4 rounded-full overflow-hidden flex bg-secondary">
                    <div
                      className="bg-primary transition-all duration-500"
                      style={{ width: `${principalPercent}%` }}
                    />
                    <div
                      className="bg-accent transition-all duration-500"
                      style={{ width: `${interestPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                      {mt.principal}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-accent" />
                      {mt.interest}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <ResultRow label={mt.monthlyPayment} value={fmt(result.monthlyPayment)} highlight />
                  <div className="border-t border-border pt-4 space-y-3">
                    <ResultRow label={mt.loanAmount} value={fmt(result.loanAmount)} />
                    <ResultRow label={mt.totalInterest} value={fmt(result.totalInterest)} />
                    <ResultRow label={mt.totalPayment} value={fmt(result.totalPayment)} />
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mt-4 border-t pt-3">
                  All calculations are indicative only and do not constitute financial advice.
                  Actual mortgage terms are subject to lender approval and prevailing interest rates.
                  Consult a licensed financial advisor before making any investment decision.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>
    </Layout>
  );
}

function InputSlider({ label, value, onChange, min, max, step, format }: {
  label: string; value: number; onChange: (v: number) => void; min: number; max: number; step: number; format: (v: number) => string;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
        <span className="text-sm font-semibold text-foreground">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-secondary rounded-full appearance-none cursor-pointer accent-accent"
      />
    </div>
  );
}

function ResultRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`font-display font-semibold ${highlight ? "text-xl text-accent" : "text-foreground"}`}>{value}</span>
    </div>
  );
}
