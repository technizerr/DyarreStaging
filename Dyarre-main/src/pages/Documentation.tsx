import { AdminLayout } from "@/pages/admin/AdminLayout";
import { ScrollReveal } from "@/components/ScrollReveal";
import { SEO } from "@/components/SEO";
import {
  BookOpen,
  Server,
  Database,
  Globe,
  Code,
  Layers,
  Key,
  FileText,
  Bot,
  Share2,
  BarChart3,
  Rocket,
} from "lucide-react";

export default function Documentation() {
  return (
    <AdminLayout>
      <SEO
        title="Documentation"
        description="Technical documentation for the Dyarre real estate platform — architecture, APIs, AI automation, integrations, and deployment guide."
        path="/docs"
      />
      <section className="py-12 lg:py-20">
        <div className="container mx-auto px-6 lg:px-8 max-w-4xl">
          <ScrollReveal>
            <div className="mb-12">
              <span className="text-xs font-medium uppercase tracking-widest text-accent">
                <BookOpen className="w-4 h-4 inline-block mr-1" />
                Documentation
              </span>
              <h1 className="mt-3 text-3xl lg:text-4xl font-display font-semibold text-foreground leading-tight">
                Project Documentation
              </h1>
              <p className="mt-3 text-muted-foreground">
                Architecture, APIs, AI automation, integrations, security, and deployment — kept in sync with the live codebase.
              </p>
            </div>
          </ScrollReveal>

          <div className="space-y-10">
            {/* ARCHITECTURE */}
            <DocSection icon={<Layers />} title="Architecture Overview">
              <p>
                Dyarre is a <strong>React 18 + Vite + TypeScript SPA</strong> backed by{" "}
                <strong>Lovable Cloud</strong> (managed PostgreSQL, Auth, Storage, and Edge Functions).
                The application is intentionally modular so new AI capabilities, social channels, and tracking
                integrations can be added without rewrites.
              </p>
              <h4 className="font-semibold mt-4 mb-2">Tech Stack</h4>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Frontend:</strong> React 18, TypeScript, Vite, Tailwind CSS v3, shadcn/ui</li>
                <li><strong>Routing / State:</strong> React Router v6, TanStack React Query</li>
                <li><strong>Backend:</strong> Lovable Cloud (PostgreSQL + RLS, Auth, Storage, Edge Functions)</li>
                <li><strong>AI Gateway:</strong> Lovable AI (Gemini, GPT-5 family) — no user-managed API keys</li>
                <li><strong>i18n:</strong> Context-based, EN / AR (RTL) / ZH</li>
                <li><strong>Charts:</strong> Recharts • <strong>Forms:</strong> react-hook-form + Zod</li>
              </ul>
              <h4 className="font-semibold mt-4 mb-2">High-Level Module Map</h4>
              <pre className="bg-secondary p-4 rounded-md text-xs font-mono overflow-x-auto">{`src/
├── components/         Reusable UI + TrackingScripts + SocialIcons
├── hooks/              useAuth, useSocialLinks, usePageTracking
├── pages/              Public pages + /admin/* dashboard
├── integrations/       Auto-generated Cloud client + types
├── i18n/               Translation contexts (en / ar / zh)
└── services/           API abstraction (currently Cloud-backed)

supabase/functions/     Edge Functions (bot-*, telegram-webhook, …)`}</pre>
            </DocSection>

            {/* DATABASE */}
            <DocSection icon={<Database />} title="Database Schema (Lovable Cloud / PostgreSQL)">
              <p>All tables live in the <code>public</code> schema with Row-Level Security enabled. Role checks go through the security-definer <code>has_role(uuid, app_role)</code> function to prevent recursion.</p>
              <div className="overflow-x-auto mt-3">
                <table className="w-full text-sm border border-border rounded-md">
                  <thead><tr className="bg-secondary"><th className="p-3 text-left font-medium">Table</th><th className="p-3 text-left font-medium">Purpose</th><th className="p-3 text-left font-medium">Access</th></tr></thead>
                  <tbody className="divide-y divide-border">
                    <tr><td className="p-3 font-mono text-xs">properties</td><td className="p-3">Main listings (DYR-XXXX ref, expiry, features[])</td><td className="p-3">Public read (visible) • Admin write</td></tr>
                    <tr><td className="p-3 font-mono text-xs">property_images</td><td className="p-3">Watermarked gallery, sort_order</td><td className="p-3">Public read • Admin write</td></tr>
                    <tr><td className="p-3 font-mono text-xs">property_types / _statuses / furnishing_options</td><td className="p-3">Dropdown taxonomies</td><td className="p-3">Public read • Admin write</td></tr>
                    <tr><td className="p-3 font-mono text-xs">locations</td><td className="p-3">UAE City → Zone hierarchy</td><td className="p-3">Public read • Admin write</td></tr>
                    <tr><td className="p-3 font-mono text-xs">contact_submissions</td><td className="p-3">Lead inbox (powers Leads dashboard)</td><td className="p-3">Public insert • Admin read</td></tr>
                    <tr><td className="p-3 font-mono text-xs">page_visits</td><td className="p-3">First-party analytics for Visitor Stats</td><td className="p-3">Public insert • Admin read</td></tr>
                    <tr><td className="p-3 font-mono text-xs">site_settings</td><td className="p-3">Branding, social, tracking, WhatsApp, AI/MCP config</td><td className="p-3">Public read (whitelisted keys) • Admin write</td></tr>
                    <tr><td className="p-3 font-mono text-xs">profiles / user_roles</td><td className="p-3">Auth user data + RBAC</td><td className="p-3">Self read • Admin manage</td></tr>
                    <tr><td className="p-3 font-mono text-xs">bot_sessions</td><td className="p-3">Telegram bot conversational state</td><td className="p-3">Admin read • Edge functions write</td></tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs">Public-safe <code>site_settings</code> keys: <code>social_media</code>, <code>meta_pixel</code>, <code>tracking_config</code>, <code>branding</code>, <code>design</code>. Sensitive keys (WhatsApp tokens, AI/MCP secrets) stay admin-only.</p>
            </DocSection>

            {/* SECURITY & AUTH */}
            <DocSection icon={<Key />} title="Authentication & Roles (RBAC)">
              <p>Email + password auth via Lovable Cloud. Two roles enforced server-side via RLS:</p>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>admin</strong> — full access to all admin routes, settings, leads, users, integrations.</li>
                <li><strong>data_entry</strong> — limited to property management.</li>
              </ul>
              <p className="mt-2">Frontend guards via <code>ProtectedRoute</code> and <code>useAuth</code>, but the source of truth is always the database policy.</p>
            </DocSection>

            {/* AI AUTOMATION */}
            <DocSection icon={<Bot />} title="AI Automation API (Agents · n8n · Telegram)">
              <p>Four public Edge Functions enable any external automation (custom AI agent, n8n, Make, Zapier, or the built-in Telegram bot) to create and publish properties. All require the header <code className="bg-secondary px-1.5 py-0.5 rounded text-xs">x-api-key: &lt;BOT_API_KEY&gt;</code> stored in Cloud secrets.</p>
              <p className="mt-2">Base URL: <code className="bg-secondary px-1.5 py-0.5 rounded text-xs">https://iltsthcthnsdclzvbbya.supabase.co/functions/v1</code></p>

              <h4 className="font-semibold mt-4 mb-2">POST /bot-create-property</h4>
              <p>Creates and publishes a property. Optional <code>image_urls[]</code> are downloaded, watermarked, and attached.</p>
              <pre className="bg-secondary p-4 rounded-md text-xs font-mono overflow-x-auto">{`curl -X POST $BASE/bot-create-property \\
  -H "x-api-key: $BOT_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "2BR Marina View",
    "type": "Apartment",
    "city": "Dubai", "zone": "Dubai Marina",
    "price": 1500000,
    "bedrooms": 2, "bathrooms": 2, "size": 1100,
    "status": "For Sale", "furnishing": "Furnished",
    "completion_status": "Ready",
    "description": "Stunning marina view…",
    "features": ["Balcony","Pool","Gym"],
    "whatsapp_number": "+971501234567",
    "image_urls": ["https://example.com/photo1.jpg"]
  }'`}</pre>

              <h4 className="font-semibold mt-4 mb-2">POST /bot-upload-image</h4>
              <p>Add a photo to an existing property — accepts <code>image_url</code> or <code>image_base64</code>.</p>

              <h4 className="font-semibold mt-4 mb-2">POST /bot-list-options</h4>
              <p>Returns valid enums (<code>type</code>, <code>status</code>, <code>furnishing</code>, locations) so agents only submit valid values.</p>

              <h4 className="font-semibold mt-4 mb-2">POST /telegram-webhook (built-in bot)</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Send free-text details ("2BR in Marina, 1.5M, furnished, ready") — Lovable AI parses into a draft</li>
                <li>Attach photos — they queue up automatically</li>
                <li><code>/show</code> previews · <code>/publish</code> creates · <code>/new</code> resets · <code>/cancel</code> clears</li>
                <li>Required before publish: <strong>title, type, city, zone</strong></li>
              </ul>
            </DocSection>

            {/* INTEGRATIONS */}
            <DocSection icon={<BarChart3 />} title="Tracking & Analytics Integrations">
              <p>All tracking IDs are stored in <code>site_settings</code> and injected dynamically by <code>TrackingScripts.tsx</code> — no redeploy needed when you add or change a pixel.</p>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Google Analytics 4</strong> — measurement ID</li>
                <li><strong>Google Tag Manager</strong> — container ID</li>
                <li><strong>Meta Pixel</strong> (Facebook / Instagram Ads)</li>
                <li><strong>TikTok Pixel</strong></li>
                <li><strong>Snapchat Pixel</strong></li>
                <li><strong>First-party visits</strong> — <code>page_visits</code> table powers the Visitor Stats dashboard + AI summaries</li>
              </ul>
              <p className="mt-2">Configure under <strong>Admin → Settings → Integrations</strong>.</p>
            </DocSection>

            {/* SOCIAL */}
            <DocSection icon={<Share2 />} title="Social Media & Messaging">
              <p>Social URLs are stored in <code>site_settings.social_media</code>. The <code>SocialIcons</code> component reads them via <code>useSocialLinks</code> and renders only the platforms that have a URL — fully data-driven, future-proof for new networks.</p>
              <p className="mt-2">Supported out of the box: <strong>Instagram, TikTok, Facebook, X, LinkedIn, YouTube</strong>. Add another platform by extending the icon map in <code>SocialIcons.tsx</code> and persisting the URL under the same settings row.</p>
              <h4 className="font-semibold mt-4 mb-2">WhatsApp</h4>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Click-to-Chat</strong> — per-property and global numbers drive deep links (e.g. <code>https://wa.me/971…?text=…</code>).</li>
                <li><strong>WhatsApp Business API</strong> — Phone Number ID + access token configurable under <strong>Settings → Messaging</strong> for future broadcast / template flows.</li>
              </ul>
            </DocSection>

            {/* API CONTRACT */}
            <DocSection icon={<Server />} title="Service Layer & API Contracts">
              <p>The <code>src/services/</code> layer abstracts data access so the frontend stays decoupled. Currently backed by the Lovable Cloud client; can be swapped for an external REST API by setting <code>VITE_API_BASE_URL</code>.</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-border rounded-md">
                  <thead><tr className="bg-secondary"><th className="p-3 text-left font-medium">Method</th><th className="p-3 text-left font-medium">Endpoint</th><th className="p-3 text-left font-medium">Purpose</th></tr></thead>
                  <tbody className="divide-y divide-border">
                    <tr><td className="p-3 font-mono text-xs">GET</td><td className="p-3 font-mono text-xs">/api/properties</td><td className="p-3">List with filters</td></tr>
                    <tr><td className="p-3 font-mono text-xs">GET</td><td className="p-3 font-mono text-xs">/api/properties/:id</td><td className="p-3">Single property</td></tr>
                    <tr><td className="p-3 font-mono text-xs">POST/PUT/DELETE</td><td className="p-3 font-mono text-xs">/api/properties[/:id]</td><td className="p-3">Admin CRUD</td></tr>
                    <tr><td className="p-3 font-mono text-xs">POST</td><td className="p-3 font-mono text-xs">/api/contact</td><td className="p-3">Lead submission</td></tr>
                    <tr><td className="p-3 font-mono text-xs">POST</td><td className="p-3 font-mono text-xs">/functions/v1/bot-*</td><td className="p-3">AI agent automation</td></tr>
                  </tbody>
                </table>
              </div>
            </DocSection>

            {/* I18N */}
            <DocSection icon={<Globe />} title="Multi-Language (i18n)">
              <p>English (LTR), Arabic (RTL), Chinese. Translations live in <code>src/i18n/translations/</code>. Dynamic per-row translations can be added via a future <code>translations</code> table without schema changes elsewhere.</p>
            </DocSection>

            {/* DEPS */}
            <DocSection icon={<Code />} title="Key Dependencies">
              <ul className="list-disc list-inside space-y-1">
                <li><strong>react / react-router-dom / @tanstack/react-query</strong> — core</li>
                <li><strong>tailwindcss + shadcn/ui</strong> — design system</li>
                <li><strong>recharts</strong> — Leads & Visitor analytics</li>
                <li><strong>react-helmet-async</strong> — SEO meta + JSON-LD</li>
                <li><strong>zod + react-hook-form</strong> — typed forms</li>
                <li><strong>sonner</strong> — toasts</li>
                <li><strong>lucide-react</strong> — icons</li>
              </ul>
            </DocSection>

            {/* DEPLOY */}
            <DocSection icon={<Rocket />} title="Deployment">
              <ol className="list-decimal list-inside space-y-2">
                <li><strong>Lovable Publish</strong> — one click; preview + custom domain handled by the platform.</li>
                <li><strong>Self-host (Hostinger / static)</strong> — <code>npm run build</code>, deploy <code>dist/</code>. Keep <code>public/.htaccess</code> for SPA routing.</li>
                <li>Edge Functions deploy automatically on save — no manual step required.</li>
                <li>Add tracking, social, and AI agent settings under <strong>Admin → Settings</strong>; they take effect immediately.</li>
              </ol>
            </DocSection>

            {/* EXTENDING */}
            <DocSection icon={<FileText />} title="Extending the Platform">
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Add a social network</strong> — extend <code>SocialIcons</code> icon map + add a field in Settings → General.</li>
                <li><strong>Add a tracking pixel</strong> — add a loader in <code>TrackingScripts.tsx</code> and a field in Settings → Integrations.</li>
                <li><strong>Add an AI capability</strong> — create a new Edge Function and call Lovable AI via the gateway (no API keys to manage).</li>
                <li><strong>Add an external integration</strong> — store credentials in Cloud Secrets, wrap in an Edge Function, and expose via <code>site_settings</code> or a typed service.</li>
              </ul>
            </DocSection>
          </div>
        </div>
      </section>
    </AdminLayout>
  );
}

function DocSection({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <ScrollReveal>
      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-xl font-display font-semibold text-foreground flex items-center gap-2 mb-4">
          <span className="text-accent">{icon}</span>
          {title}
        </h2>
        <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
          {children}
        </div>
      </div>
    </ScrollReveal>
  );
}
