import { useState, useEffect } from "react";
import { AdminLayout } from "./AdminLayout";
import { Palette, Database, Cloud, Server, Save, CheckCircle, Type, Phone, Globe, Mail, Share2, BarChart3, MessageCircle, Bot, Copy, ImageIcon, Send, RefreshCw } from "lucide-react";
import { WatermarkPresetEditor } from "@/components/admin/WatermarkPresetEditor";
import { MediaTrashPanel } from "@/components/admin/MediaTrashPanel";
import { MediaAuditLogPanel } from "@/components/admin/MediaAuditLogPanel";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

type BackendMode = "cloud" | "mysql";

interface BackendConfig { mode: BackendMode; mysqlHost: string; mysqlPort: string; mysqlDatabase: string; mysqlUser: string; mysqlPassword: string; apiBaseUrl: string; }
interface DesignConfig { primaryColor: string; accentColor: string; siteName: string; contactEmail: string; contactPhone: string; whatsappDefault: string; address: string; logoUrl: string; defaultLanguage: string; heroTitle: string; heroSubtitle: string; }
interface PixelConfig { metaPixelId: string; }
interface TrackingConfig { gaMeasurementId: string; gtmId: string; tiktokPixelId: string; snapPixelId: string; }
interface WhatsAppBusinessConfig { phoneNumberId: string; businessAccountId: string; accessToken: string; defaultTemplate: string; }
interface McpConfig { enabled: boolean; allowedOrigins: string; }
interface AiConfig { api_key: string; endpoint: string; model: string; }
interface SocialConfig { instagram: string; tiktok: string; facebook: string; twitter: string; linkedin: string; youtube: string; }
interface TelegramConfig {
  botUsername: string;
  allowedChatIds: string;
  welcomeMessage: string;
  defaultStatus: string;
  defaultFurnishing: string;
  defaultCompletion: string;
  autoPublish: boolean;
}

const defaultSocial: SocialConfig = { instagram: "", tiktok: "", facebook: "", twitter: "", linkedin: "", youtube: "" };
const defaultBackend: BackendConfig = { mode: "cloud", mysqlHost: "localhost", mysqlPort: "3306", mysqlDatabase: "dyarre_db", mysqlUser: "root", mysqlPassword: "", apiBaseUrl: "" };
const defaultDesign: DesignConfig = { primaryColor: "#7a6240", accentColor: "#b37d3b", siteName: "Dyarré", contactEmail: "dyarree@gmail.com", contactPhone: "+971544444518", whatsappDefault: "+971544444518", address: "Abu Dhabi, UAE", logoUrl: "", defaultLanguage: "en", heroTitle: "Find Your Dream Property in the UAE", heroSubtitle: "Luxury real estate across the Emirates" };
const defaultTracking: TrackingConfig = { gaMeasurementId: "", gtmId: "", tiktokPixelId: "", snapPixelId: "" };
const defaultWhatsApp: WhatsAppBusinessConfig = { phoneNumberId: "", businessAccountId: "", accessToken: "", defaultTemplate: "" };
const defaultMcp: McpConfig = { enabled: false, allowedOrigins: "" };
const defaultTelegram: TelegramConfig = { botUsername: "", allowedChatIds: "", welcomeMessage: "", defaultStatus: "For Sale", defaultFurnishing: "Unfurnished", defaultCompletion: "Ready", autoPublish: false };

export default function AdminSettings() {
  const [backend, setBackend] = useState<BackendConfig>(defaultBackend);
  const [design, setDesign] = useState<DesignConfig>(defaultDesign);
  const [pixel, setPixel] = useState<PixelConfig>({ metaPixelId: "" });
  const [tracking, setTracking] = useState<TrackingConfig>(defaultTracking);
  const [whatsapp, setWhatsapp] = useState<WhatsAppBusinessConfig>(defaultWhatsApp);
  const [mcp, setMcp] = useState<McpConfig>(defaultMcp);
  const [aiConfig, setAiConfig] = useState<AiConfig>({ api_key: "", endpoint: "https://api.openai.com/v1/chat/completions", model: "gpt-4o-mini" });
  const [social, setSocial] = useState<SocialConfig>(defaultSocial);
  const [telegram, setTelegram] = useState<TelegramConfig>(defaultTelegram);
  const [registeringWebhook, setRegisteringWebhook] = useState(false);
  const [webhookInfo, setWebhookInfo] = useState<string>("");
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const projectRef = supabaseUrl?.match(/https:\/\/(.+?)\.supabase/)?.[1] ?? "";

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["backend_config", "design_config", "meta_pixel", "tracking_config", "whatsapp_business", "mcp_config", "ai_config", "social_media", "telegram_bot"])
      .then(({ data }) => {
        data?.forEach((row) => {
          const v = row.value as Record<string, unknown>;
          if (!v || typeof v !== "object") return;
          if (row.key === "backend_config") setBackend({ ...defaultBackend, ...(v as Partial<BackendConfig>) });
          if (row.key === "design_config") setDesign({ ...defaultDesign, ...(v as Partial<DesignConfig>) });
          if (row.key === "meta_pixel") setPixel({ metaPixelId: "", ...(v as Partial<PixelConfig>) });
          if (row.key === "tracking_config") setTracking({ ...defaultTracking, ...(v as Partial<TrackingConfig>) });
          if (row.key === "whatsapp_business") setWhatsapp({ ...defaultWhatsApp, ...(v as Partial<WhatsAppBusinessConfig>) });
          if (row.key === "mcp_config") setMcp({ ...defaultMcp, ...(v as Partial<McpConfig>) });
          if (row.key === "ai_config") setAiConfig({ api_key: "", endpoint: "https://api.openai.com/v1/chat/completions", model: "gpt-4o-mini", ...(v as Partial<AiConfig>) });
          if (row.key === "social_media") setSocial({ ...defaultSocial, ...(v as Partial<SocialConfig>) });
          if (row.key === "telegram_bot") setTelegram({ ...defaultTelegram, ...(v as Partial<TelegramConfig>) });
        });
      });
  }, []);

  const saveConfig = async (key: string, value: object) => {
    setSaving((s) => ({ ...s, [key]: true }));
    const json = JSON.parse(JSON.stringify(value));
    const { data: existing } = await supabase.from("site_settings").select("id").eq("key", key).maybeSingle();
    const { error } = existing
      ? await supabase.from("site_settings").update({ value: json }).eq("key", key)
      : await supabase.from("site_settings").insert([{ key, value: json }]);
    setSaving((s) => ({ ...s, [key]: false }));
    if (error) { toast.error(error.message); return; }
    setSaved((s) => ({ ...s, [key]: true }));
    toast.success("Settings saved");
    setTimeout(() => setSaved((s) => ({ ...s, [key]: false })), 2000);
  };

  const copy = (text: string) => { navigator.clipboard.writeText(text); toast.success("Copied"); };

  const registerTelegramWebhook = async () => {
    setRegisteringWebhook(true);
    setWebhookInfo("");
    try {
      const { data, error } = await supabase.functions.invoke("setup-telegram-webhook");
      if (error) throw error;
      setWebhookInfo(JSON.stringify(data, null, 2));
      toast.success("Telegram webhook registered");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to register webhook");
      setWebhookInfo(String(e?.message ?? e));
    } finally {
      setRegisteringWebhook(false);
    }
  };

  const SaveBtn = ({ keyName, label }: { keyName: string; label: string }) => (
    <button
      onClick={() => {
        const map: Record<string, object> = {
          backend_config: backend, design_config: design, meta_pixel: pixel,
          tracking_config: tracking, whatsapp_business: whatsapp, mcp_config: mcp,
          ai_config: aiConfig, social_media: social, telegram_bot: telegram,
        };
        saveConfig(keyName, map[keyName]);
      }}
      disabled={saving[keyName]}
      className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:opacity-90 active:scale-[0.97] disabled:opacity-50"
    >
      {saved[keyName] ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
      {saving[keyName] ? "Saving…" : saved[keyName] ? "Saved!" : label}
    </button>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-semibold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Configuration, branding, integrations and automation</p>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="media">Media & Watermarks</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="messaging">Messaging</TabsTrigger>
            <TabsTrigger value="automation">AI & Automation</TabsTrigger>
          </TabsList>

          {/* GENERAL TAB */}
          <TabsContent value="general" className="space-y-6 mt-6">
            {/* Backend */}
            <div className="bg-card rounded-lg border border-border p-6 space-y-6">
              <div className="flex items-center gap-3"><Database className="w-5 h-5 text-accent" /><h3 className="font-display font-semibold">Backend Configuration</h3></div>
              <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                <div className="flex items-center gap-3">
                  {backend.mode === "cloud" ? <Cloud className="w-5 h-5 text-accent" /> : <Server className="w-5 h-5 text-destructive" />}
                  <div>
                    <p className="text-sm font-medium">{backend.mode === "cloud" ? "Lovable Cloud (PostgreSQL)" : "MySQL (Self-Hosted)"}</p>
                    <p className="text-xs text-muted-foreground">{backend.mode === "cloud" ? "Integrated cloud backend" : "Connect to your own MySQL via Node.js API"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Cloud</span>
                  <Switch checked={backend.mode === "mysql"} onCheckedChange={(c) => setBackend((p) => ({ ...p, mode: c ? "mysql" : "cloud" }))} />
                  <span className="text-xs text-muted-foreground">MySQL</span>
                </div>
              </div>
              {backend.mode === "mysql" && (
                <div className="space-y-4 border border-border rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <SettingsInput label="Host" value={backend.mysqlHost} onChange={(v) => setBackend((p) => ({ ...p, mysqlHost: v }))} />
                    <SettingsInput label="Port" value={backend.mysqlPort} onChange={(v) => setBackend((p) => ({ ...p, mysqlPort: v }))} />
                    <SettingsInput label="Database" value={backend.mysqlDatabase} onChange={(v) => setBackend((p) => ({ ...p, mysqlDatabase: v }))} />
                    <SettingsInput label="User" value={backend.mysqlUser} onChange={(v) => setBackend((p) => ({ ...p, mysqlUser: v }))} />
                    <SettingsInput label="Password" value={backend.mysqlPassword} onChange={(v) => setBackend((p) => ({ ...p, mysqlPassword: v }))} type="password" />
                  </div>
                  <SettingsInput label="API Base URL" value={backend.apiBaseUrl} onChange={(v) => setBackend((p) => ({ ...p, apiBaseUrl: v }))} placeholder="https://api.yourdomain.com" />
                </div>
              )}
              <SaveBtn keyName="backend_config" label="Save Backend Config" />
            </div>

            {/* Design */}
            <div className="bg-card rounded-lg border border-border p-6 space-y-6">
              <div className="flex items-center gap-3"><Palette className="w-5 h-5 text-accent" /><h3 className="font-display font-semibold">Design & Branding</h3></div>
              <div className="grid sm:grid-cols-2 gap-4">
                <SettingsInput label="Site Name" value={design.siteName} onChange={(v) => setDesign((p) => ({ ...p, siteName: v }))} icon={<Type className="w-4 h-4" />} />
                <SettingsInput label="Default Language" value={design.defaultLanguage} onChange={(v) => setDesign((p) => ({ ...p, defaultLanguage: v }))} icon={<Globe className="w-4 h-4" />} />
                <ColorInput label="Primary Color" value={design.primaryColor} onChange={(v) => setDesign((p) => ({ ...p, primaryColor: v }))} />
                <ColorInput label="Accent Color" value={design.accentColor} onChange={(v) => setDesign((p) => ({ ...p, accentColor: v }))} />
              </div>
              <div className="border-t border-border pt-4">
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><Phone className="w-4 h-4" /> Contact</h4>
                <div className="grid sm:grid-cols-2 gap-4">
                  <SettingsInput label="Contact Email" value={design.contactEmail} onChange={(v) => setDesign((p) => ({ ...p, contactEmail: v }))} icon={<Mail className="w-4 h-4" />} />
                  <SettingsInput label="Contact Phone" value={design.contactPhone} onChange={(v) => setDesign((p) => ({ ...p, contactPhone: v }))} />
                  <SettingsInput label="Default WhatsApp" value={design.whatsappDefault} onChange={(v) => setDesign((p) => ({ ...p, whatsappDefault: v }))} />
                  <SettingsInput label="Address" value={design.address} onChange={(v) => setDesign((p) => ({ ...p, address: v }))} />
                </div>
              </div>
              <div className="border-t border-border pt-4 grid sm:grid-cols-1 gap-4">
                <SettingsInput label="Hero Title" value={design.heroTitle} onChange={(v) => setDesign((p) => ({ ...p, heroTitle: v }))} />
                <SettingsInput label="Hero Subtitle" value={design.heroSubtitle} onChange={(v) => setDesign((p) => ({ ...p, heroSubtitle: v }))} />
              </div>
              <SaveBtn keyName="design_config" label="Save Design Settings" />
            </div>

            {/* Logos */}
            <LogosCard />


            {/* Social */}
            <div className="bg-card rounded-lg border border-border p-6 space-y-6">
              <div className="flex items-center gap-3"><Share2 className="w-5 h-5 text-accent" /><h3 className="font-display font-semibold">Social Media</h3></div>
              <p className="text-xs text-muted-foreground">Add social URLs. Leave empty to hide.</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <SettingsInput label="Instagram" value={social.instagram} onChange={(v) => setSocial((p) => ({ ...p, instagram: v }))} placeholder="https://instagram.com/..." />
                <SettingsInput label="TikTok" value={social.tiktok} onChange={(v) => setSocial((p) => ({ ...p, tiktok: v }))} placeholder="https://tiktok.com/@..." />
                <SettingsInput label="Facebook" value={social.facebook} onChange={(v) => setSocial((p) => ({ ...p, facebook: v }))} />
                <SettingsInput label="X (Twitter)" value={social.twitter} onChange={(v) => setSocial((p) => ({ ...p, twitter: v }))} />
                <SettingsInput label="LinkedIn" value={social.linkedin} onChange={(v) => setSocial((p) => ({ ...p, linkedin: v }))} />
                <SettingsInput label="YouTube" value={social.youtube} onChange={(v) => setSocial((p) => ({ ...p, youtube: v }))} />
              </div>
              <SaveBtn keyName="social_media" label="Save Social Media" />
            </div>
          </TabsContent>

          {/* MEDIA & WATERMARKS TAB */}
          <TabsContent value="media" className="space-y-6 mt-6">
            <div className="bg-card rounded-lg border border-border p-6 space-y-4">
              <div className="flex items-center gap-3">
                <ImageIcon className="w-5 h-5 text-accent" />
                <h3 className="font-display font-semibold">Watermark Presets</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Define unlimited watermarks (text, reference, sequence, title, price, or logo). They are
                stamped on every newly uploaded image in sequence order. Originals are stored privately so
                you can re-apply at any time.
              </p>
              <WatermarkPresetEditor />
            </div>

            <div className="bg-card rounded-lg border border-border p-6 space-y-4">
              <div className="flex items-center gap-3">
                <ImageIcon className="w-5 h-5 text-accent" />
                <h3 className="font-display font-semibold">Media Trash (global)</h3>
              </div>
              <MediaTrashPanel />
            </div>

            <div className="bg-card rounded-lg border border-border p-6 space-y-4">
              <div className="flex items-center gap-3">
                <ImageIcon className="w-5 h-5 text-accent" />
                <h3 className="font-display font-semibold">Audit Log</h3>
              </div>
              <MediaAuditLogPanel />
            </div>
          </TabsContent>

          {/* INTEGRATIONS / TRACKING TAB */}
          <TabsContent value="integrations" className="space-y-6 mt-6">
            <div className="bg-card rounded-lg border border-border p-6 space-y-4">
              <div className="flex items-center gap-3"><BarChart3 className="w-5 h-5 text-accent" /><h3 className="font-display font-semibold">Analytics & Advertising Pixels</h3></div>
              <p className="text-xs text-muted-foreground">Tracking scripts auto-load on every page. Leave blank to disable an individual integration. No code changes required.</p>

              <div className="grid sm:grid-cols-2 gap-4">
                <SettingsInput label="Meta Pixel ID" value={pixel.metaPixelId} onChange={(v) => setPixel({ metaPixelId: v })} placeholder="e.g. 1234567890" />
                <div />
              </div>
              <SaveBtn keyName="meta_pixel" label="Save Meta Pixel" />

              <div className="border-t border-border pt-4 grid sm:grid-cols-2 gap-4">
                <SettingsInput label="Google Analytics 4 ID" value={tracking.gaMeasurementId} onChange={(v) => setTracking((p) => ({ ...p, gaMeasurementId: v }))} placeholder="G-XXXXXXXXXX" />
                <SettingsInput label="Google Tag Manager ID" value={tracking.gtmId} onChange={(v) => setTracking((p) => ({ ...p, gtmId: v }))} placeholder="GTM-XXXXXXX" />
                <SettingsInput label="TikTok Pixel ID" value={tracking.tiktokPixelId} onChange={(v) => setTracking((p) => ({ ...p, tiktokPixelId: v }))} placeholder="CXXXXXXXXXXXXXXXX" />
                <SettingsInput label="Snapchat Pixel ID" value={tracking.snapPixelId} onChange={(v) => setTracking((p) => ({ ...p, snapPixelId: v }))} placeholder="00000000-0000-0000-0000-000000000000" />
              </div>
              <SaveBtn keyName="tracking_config" label="Save Tracking IDs" />

              <div className="text-xs text-muted-foreground p-3 bg-secondary rounded-md space-y-1">
                <p><strong>Where to find your IDs:</strong></p>
                <p>• <strong>GA4:</strong> Admin → Data Streams → Web → Measurement ID</p>
                <p>• <strong>GTM:</strong> Top of Tag Manager workspace (GTM-XXXXXXX)</p>
                <p>• <strong>TikTok:</strong> Events Manager → Web Events → Pixel ID</p>
                <p>• <strong>Snapchat:</strong> Ads Manager → Events Manager → Snap Pixel ID</p>
                <p>• <strong>Meta:</strong> Events Manager → Data Sources → Pixel ID</p>
              </div>
            </div>
          </TabsContent>

          {/* MESSAGING TAB */}
          <TabsContent value="messaging" className="space-y-6 mt-6">
            <div className="bg-card rounded-lg border border-border p-6 space-y-4">
              <div className="flex items-center gap-3"><MessageCircle className="w-5 h-5 text-accent" /><h3 className="font-display font-semibold">WhatsApp Business API</h3></div>
              <p className="text-xs text-muted-foreground">Optional — for sending automated templated messages via WhatsApp Cloud API. The basic click-to-chat number is set under General → Contact.</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <SettingsInput label="Phone Number ID" value={whatsapp.phoneNumberId} onChange={(v) => setWhatsapp((p) => ({ ...p, phoneNumberId: v }))} placeholder="e.g. 105954xxxxxxxxx" />
                <SettingsInput label="Business Account ID" value={whatsapp.businessAccountId} onChange={(v) => setWhatsapp((p) => ({ ...p, businessAccountId: v }))} placeholder="WABA ID" />
                <SettingsInput label="Access Token" value={whatsapp.accessToken} onChange={(v) => setWhatsapp((p) => ({ ...p, accessToken: v }))} type="password" placeholder="EAAG..." />
                <SettingsInput label="Default Template Name" value={whatsapp.defaultTemplate} onChange={(v) => setWhatsapp((p) => ({ ...p, defaultTemplate: v }))} placeholder="lead_followup" />
              </div>
              <SaveBtn keyName="whatsapp_business" label="Save WhatsApp Business" />
              <div className="text-xs text-muted-foreground p-3 bg-secondary rounded-md">
                Get these credentials from <strong>developers.facebook.com</strong> → Your App → WhatsApp → API Setup. The access token should ideally be a permanent system-user token.
              </div>
            </div>

            {/* Telegram Bot */}
            <div className="bg-card rounded-lg border border-border p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Send className="w-5 h-5 text-accent" />
                <h3 className="font-display font-semibold">Telegram Bot</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Configure the Telegram listing bot. The bot token is provided by the Telegram connector
                (<code>TELEGRAM_API_KEY</code>) and the service role key is managed by the backend — both stay server-side.
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                <SettingsInput
                  label="Bot Username"
                  value={telegram.botUsername}
                  onChange={(v) => setTelegram((p) => ({ ...p, botUsername: v }))}
                  placeholder="@DyarreListingsBot"
                />
                <SettingsInput
                  label="Allowed Chat IDs (comma-separated)"
                  value={telegram.allowedChatIds}
                  onChange={(v) => setTelegram((p) => ({ ...p, allowedChatIds: v }))}
                  placeholder="123456789, 987654321"
                />
                <SettingsInput
                  label="Default Listing Status"
                  value={telegram.defaultStatus}
                  onChange={(v) => setTelegram((p) => ({ ...p, defaultStatus: v }))}
                  placeholder="For Sale"
                />
                <SettingsInput
                  label="Default Furnishing"
                  value={telegram.defaultFurnishing}
                  onChange={(v) => setTelegram((p) => ({ ...p, defaultFurnishing: v }))}
                  placeholder="Unfurnished"
                />
                <SettingsInput
                  label="Default Completion"
                  value={telegram.defaultCompletion}
                  onChange={(v) => setTelegram((p) => ({ ...p, defaultCompletion: v }))}
                  placeholder="Ready"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">
                  Welcome / Help Message
                </label>
                <textarea
                  value={telegram.welcomeMessage}
                  onChange={(e) => setTelegram((p) => ({ ...p, welcomeMessage: e.target.value }))}
                  rows={3}
                  placeholder="Sent when a user runs /start. Leave empty for the default."
                  className="w-full px-3 py-2 text-sm rounded-md bg-secondary border-0 focus:ring-2 focus:ring-accent/40 outline-none resize-y"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-secondary rounded-md">
                <div>
                  <p className="text-sm font-semibold">Auto-publish on /publish</p>
                  <p className="text-xs text-muted-foreground">Listings created via the bot are immediately visible on the site.</p>
                </div>
                <Switch checked={telegram.autoPublish} onCheckedChange={(c) => setTelegram((p) => ({ ...p, autoPublish: c }))} />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <SaveBtn keyName="telegram_bot" label="Save Telegram Config" />
                <button
                  onClick={registerTelegramWebhook}
                  disabled={registeringWebhook}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-secondary text-foreground rounded-md hover:bg-secondary/70 active:scale-[0.97] disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${registeringWebhook ? "animate-spin" : ""}`} />
                  {registeringWebhook ? "Registering…" : "Register / Refresh Webhook"}
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Webhook URL</p>
                <EndpointRow label="Telegram webhook" url={`${supabaseUrl}/functions/v1/telegram-webhook`} onCopy={copy} />
              </div>

              {webhookInfo && (
                <pre className="text-xs bg-secondary rounded-md p-3 overflow-auto max-h-60 whitespace-pre-wrap break-all">{webhookInfo}</pre>
              )}

              <div className="text-xs text-muted-foreground p-3 bg-accent/10 rounded-md space-y-1">
                <p className="font-semibold">Setup steps</p>
                <p>1. Create a bot with <code>@BotFather</code> and connect Telegram in the backend (sets <code>TELEGRAM_API_KEY</code>).</p>
                <p>2. Open a chat with your bot, send <code>/start</code>, then read its <code>chat_id</code> from <code>/getUpdates</code> or any bot helper and add it to <strong>Allowed Chat IDs</strong>.</p>
                <p>3. Set the backend secret <code>ALLOWED_TELEGRAM_CHAT_IDS</code> to the same list (the webhook enforces it server-side).</p>
                <p>4. Click <strong>Register / Refresh Webhook</strong>. Telegram will then deliver messages to your bot.</p>
              </div>
            </div>
          </TabsContent>


          {/* AUTOMATION / MCP TAB */}
          <TabsContent value="automation" className="space-y-6 mt-6">
            <div className="bg-card rounded-lg border border-border p-6 space-y-4">
              <div className="flex items-center gap-3"><Bot className="w-5 h-5 text-accent" /><h3 className="font-display font-semibold">AI Agent Endpoints (MCP-compatible)</h3></div>
              <p className="text-xs text-muted-foreground">Use these HTTP endpoints from any AI agent platform (n8n, Make, OpenAI Assistants, Claude tool-use, or any MCP-compatible orchestrator) to create, list and manage properties.</p>

              <div className="space-y-2">
                <EndpointRow label="Create property" url={`${supabaseUrl}/functions/v1/bot-create-property`} onCopy={copy} />
                <EndpointRow label="Upload property image" url={`${supabaseUrl}/functions/v1/bot-upload-image`} onCopy={copy} />
                <EndpointRow label="List option values" url={`${supabaseUrl}/functions/v1/bot-list-options`} onCopy={copy} />
                <EndpointRow label="Telegram webhook" url={`${supabaseUrl}/functions/v1/telegram-webhook`} onCopy={copy} />
              </div>

              <div className="p-3 bg-secondary rounded-md text-xs space-y-1">
                <p className="font-semibold">Authentication header</p>
                <code className="block bg-card p-2 rounded">x-api-key: &lt;your BOT_API_KEY secret&gt;</code>
                <p className="text-muted-foreground">The bot key is stored as the <code>BOT_API_KEY</code> backend secret. Rotate it any time from your backend secrets.</p>
              </div>

              <div className="border-t border-border pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">Enable MCP gateway</p>
                    <p className="text-xs text-muted-foreground">Allow AI agents to discover and call these endpoints via MCP. (Endpoints remain available regardless.)</p>
                  </div>
                  <Switch checked={mcp.enabled} onCheckedChange={(c) => setMcp((p) => ({ ...p, enabled: c }))} />
                </div>
                <SettingsInput label="Allowed Origins (comma-separated)" value={mcp.allowedOrigins} onChange={(v) => setMcp((p) => ({ ...p, allowedOrigins: v }))} placeholder="https://app.n8n.io, https://hook.make.com" />
                <SaveBtn keyName="mcp_config" label="Save MCP Config" />
              </div>

              <div className="text-xs text-muted-foreground p-3 bg-accent/10 rounded-md">
                <p className="font-semibold mb-1">Telegram bot setup</p>
                <p>1. Talk to <code>@BotFather</code> on Telegram → <code>/newbot</code> → copy the token.</p>
                <p>2. Set the token as the <code>TELEGRAM_API_KEY</code> backend secret (already connected via the Telegram connector).</p>
                <p>3. Point the bot webhook to the Telegram webhook URL above:</p>
                <code className="block bg-card p-2 rounded mt-1 break-all">https://api.telegram.org/bot&lt;TOKEN&gt;/setWebhook?url={supabaseUrl}/functions/v1/telegram-webhook</code>
              </div>
            </div>

            {/* Custom AI Provider */}
            <div className="bg-card rounded-lg border border-border p-6 space-y-4">
              <div className="flex items-center gap-3"><Database className="w-5 h-5 text-accent" /><h3 className="font-display font-semibold">Custom AI Provider</h3></div>
              <p className="text-xs text-muted-foreground">Optional override — use a custom OpenAI-compatible endpoint for visitor analysis (default uses built-in Lovable AI).</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <SettingsInput label="API Key" value={aiConfig.api_key} onChange={(v) => setAiConfig((p) => ({ ...p, api_key: v }))} type="password" />
                <SettingsInput label="API Endpoint" value={aiConfig.endpoint} onChange={(v) => setAiConfig((p) => ({ ...p, endpoint: v }))} />
                <SettingsInput label="Model" value={aiConfig.model} onChange={(v) => setAiConfig((p) => ({ ...p, model: v }))} />
              </div>
              <SaveBtn keyName="ai_config" label="Save AI Config" />
            </div>

            {projectRef && (
              <p className="text-xs text-muted-foreground">Project ref: <code>{projectRef}</code></p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

function EndpointRow({ label, url, onCopy }: { label: string; url: string; onCopy: (t: string) => void }) {
  return (
    <div className="flex items-center gap-2 p-2 bg-secondary rounded-md">
      <span className="text-xs font-medium min-w-[160px]">{label}</span>
      <code className="text-xs flex-1 truncate">{url}</code>
      <button onClick={() => onCopy(url)} className="p-1.5 hover:bg-background rounded" aria-label="Copy">
        <Copy className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-10 h-10 rounded border border-border cursor-pointer" />
        <input value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 px-3 py-2 text-sm rounded-md bg-secondary border-0 focus:ring-2 focus:ring-accent/40 outline-none" />
      </div>
    </div>
  );
}

function SettingsInput({ label, value, onChange, type = "text", placeholder, icon }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; icon?: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">{label}</label>
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>}
        <input
          type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className={`w-full ${icon ? "pl-9" : "px-3"} py-2 text-sm rounded-md bg-secondary border-0 focus:ring-2 focus:ring-accent/40 outline-none`}
        />
      </div>
    </div>
  );
}

function LogosCard() {
  const [logos, setLogos] = useState({ logo_light_bg_url: "", logo_dark_bg_url: "" });
  const [uploading, setUploading] = useState<null | "light" | "dark">(null);
  const DEFAULTS = {
    logo_light_bg_url:
      "https://iltsthcthnsdclzvbbya.supabase.co/storage/v1/object/public/property-images/branding/logo-light-bg-default.png",
    logo_dark_bg_url:
      "https://iltsthcthnsdclzvbbya.supabase.co/storage/v1/object/public/property-images/branding/logo-dark-bg-default.png",
  };

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "branding_logos")
      .maybeSingle()
      .then(({ data }) => {
        const v = (data?.value ?? {}) as Partial<typeof DEFAULTS>;
        setLogos({
          logo_light_bg_url: v.logo_light_bg_url || DEFAULTS.logo_light_bg_url,
          logo_dark_bg_url: v.logo_dark_bg_url || DEFAULTS.logo_dark_bg_url,
        });
      });
  }, []);

  const persist = async (next: typeof logos) => {
    setLogos(next);
    const { data: existing } = await supabase.from("site_settings").select("id").eq("key", "branding_logos").maybeSingle();
    const payload = JSON.parse(JSON.stringify(next));
    const { error } = existing
      ? await supabase.from("site_settings").update({ value: payload }).eq("key", "branding_logos")
      : await supabase.from("site_settings").insert([{ key: "branding_logos", value: payload }]);
    if (error) { toast.error(error.message); return; }
    toast.success("Logo updated — refresh to see it everywhere");
  };

  const upload = async (slot: "light" | "dark", file: File) => {
    if (file.size > 2 * 1024 * 1024) { toast.error("Max 2 MB"); return; }
    setUploading(slot);
    try {
      const ext = (file.name.split(".").pop() || "png").toLowerCase();
      const path = `branding/logo-${slot}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("property-images").upload(path, file, {
        cacheControl: "3600", upsert: true, contentType: file.type || undefined,
      });
      if (error) throw error;
      const { data } = supabase.storage.from("property-images").getPublicUrl(path);
      const key = slot === "light" ? "logo_light_bg_url" : "logo_dark_bg_url";
      await persist({ ...logos, [key]: data.publicUrl });
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed");
    } finally {
      setUploading(null);
    }
  };

  const reset = (slot: "light" | "dark") => {
    const key = slot === "light" ? "logo_light_bg_url" : "logo_dark_bg_url";
    persist({ ...logos, [key]: DEFAULTS[key] });
  };

  const Slot = ({ slot, label, bgClass }: { slot: "light" | "dark"; label: string; bgClass: string }) => {
    const url = slot === "light" ? logos.logo_light_bg_url : logos.logo_dark_bg_url;
    return (
      <div className="space-y-3">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">{label}</label>
        <div className={`rounded-md border border-border flex items-center justify-center p-6 ${bgClass}`}>
          {url ? <img src={url} alt={label} className="h-16 w-auto object-contain" /> : <span className="text-xs opacity-60">No logo</span>}
        </div>
        <div className="flex items-center gap-2">
          <label className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:opacity-90 cursor-pointer">
            {uploading === slot ? "Uploading…" : "Upload new"}
            <input
              type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden"
              disabled={uploading === slot}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(slot, f); e.currentTarget.value = ""; }}
            />
          </label>
          <button onClick={() => reset(slot)} className="px-3 py-2 text-xs rounded-md border border-border hover:bg-secondary">
            Reset to default
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6 space-y-6">
      <div className="flex items-center gap-3">
        <ImageIcon className="w-5 h-5 text-accent" />
        <h3 className="font-display font-semibold">Site Logos</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Upload two versions: one optimized for light backgrounds (navbar) and one for dark backgrounds (footer).
        PNG, JPG, WebP, or SVG. Max 2 MB. Recommended ~512×160.
      </p>
      <div className="grid sm:grid-cols-2 gap-6">
        <Slot slot="light" label="Logo (light background)" bgClass="bg-card" />
        <Slot slot="dark" label="Logo (dark background)" bgClass="bg-foreground" />
      </div>
    </div>
  );
}

