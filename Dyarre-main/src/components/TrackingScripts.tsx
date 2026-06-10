import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface TrackingConfig {
  metaPixelId?: string;
  gaMeasurementId?: string;
  tiktokPixelId?: string;
  snapPixelId?: string;
  gtmId?: string;
}

let loaded = false;
let cachedConfig: TrackingConfig = {};

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
    ttq?: { load: (id: string) => void; page: () => void; track: (e: string) => void };
    snaptr?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

function injectScript(src: string, async = true) {
  const s = document.createElement("script");
  s.src = src;
  s.async = async;
  document.head.appendChild(s);
  return s;
}

function loadMetaPixel(id: string) {
  if (!id || window.fbq) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (function (f: any, b: Document, e: string, v: string) {
    if (f.fbq) return;
    const n: any = (f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    });
    if (!f._fbq) f._fbq = n;
    n.push = n; n.loaded = true; n.version = "2.0"; n.queue = [];
    const t = b.createElement(e) as HTMLScriptElement;
    t.async = true; t.src = v;
    const s = b.getElementsByTagName(e)[0];
    s.parentNode?.insertBefore(t, s);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
  window.fbq?.("init", id);
  window.fbq?.("track", "PageView");
}

function loadGA(id: string) {
  if (!id || window.gtag) return;
  injectScript(`https://www.googletagmanager.com/gtag/js?id=${id}`);
  window.dataLayer = window.dataLayer || [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  window.gtag = function () { window.dataLayer!.push(arguments as any); };
  window.gtag("js", new Date());
  window.gtag("config", id);
}

function loadGTM(id: string) {
  if (!id) return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
  injectScript(`https://www.googletagmanager.com/gtm.js?id=${id}`);
}

function loadTikTok(id: string) {
  if (!id || window.ttq) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (function (w: any, d: Document, t: string) {
    w.TiktokAnalyticsObject = t;
    const ttq: any = (w[t] = w[t] || []);
    ttq.methods = ["page", "track", "identify", "instances", "debug", "on", "off", "once", "ready", "alias", "group", "enableCookie", "disableCookie"];
    ttq.setAndDefer = function (t: any, e: string) { t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))); }; };
    for (let i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
    ttq.instance = function (t: string) { const e = ttq._i[t] || []; for (let n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]); return e; };
    ttq.load = function (e: string, n?: any) {
      const r = "https://analytics.tiktok.com/i18n/pixel/events.js";
      ttq._i = ttq._i || {}; ttq._i[e] = []; ttq._i[e]._u = r; ttq._t = ttq._t || {}; ttq._t[e] = +new Date(); ttq._o = ttq._o || {}; ttq._o[e] = n || {};
      const o = d.createElement("script") as HTMLScriptElement;
      o.type = "text/javascript"; o.async = true; o.src = r + "?sdkid=" + e + "&lib=" + t;
      const a = d.getElementsByTagName("script")[0]; a.parentNode?.insertBefore(o, a);
    };
  })(window, document, "ttq");
  window.ttq?.load(id);
  window.ttq?.page();
}

function loadSnap(id: string) {
  if (!id || window.snaptr) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (function (e: any, t: Document, n: string) {
    if (e.snaptr) return;
    const a: any = (e.snaptr = function () { a.handleRequest ? a.handleRequest.apply(a, arguments) : a.queue.push(arguments); });
    a.queue = [];
    const s = "script";
    const r = t.createElement(s) as HTMLScriptElement;
    r.async = true; r.src = n;
    const u = t.getElementsByTagName(s)[0]; u.parentNode?.insertBefore(r, u);
  })(window, document, "https://sc-static.net/scevent.min.js");
  window.snaptr?.("init", id);
  window.snaptr?.("track", "PAGE_VIEW");
}

export function TrackingScripts() {
  const location = useLocation();

  useEffect(() => {
    if (loaded) return;
    loaded = true;
    supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["meta_pixel", "tracking_config"])
      .then(({ data }) => {
        const cfg: TrackingConfig = {};
        data?.forEach((row) => {
          const v = (row.value || {}) as Record<string, string>;
          if (row.key === "meta_pixel") cfg.metaPixelId = v.metaPixelId;
          if (row.key === "tracking_config") {
            cfg.gaMeasurementId = v.gaMeasurementId;
            cfg.tiktokPixelId = v.tiktokPixelId;
            cfg.snapPixelId = v.snapPixelId;
            cfg.gtmId = v.gtmId;
          }
        });
        cachedConfig = cfg;
        if (cfg.metaPixelId) loadMetaPixel(cfg.metaPixelId);
        if (cfg.gaMeasurementId) loadGA(cfg.gaMeasurementId);
        if (cfg.gtmId) loadGTM(cfg.gtmId);
        if (cfg.tiktokPixelId) loadTikTok(cfg.tiktokPixelId);
        if (cfg.snapPixelId) loadSnap(cfg.snapPixelId);
      });
  }, []);

  // Fire page views on route change
  useEffect(() => {
    window.fbq?.("track", "PageView");
    if (cachedConfig.gaMeasurementId) {
      window.gtag?.("event", "page_view", { page_path: location.pathname });
    }
    window.ttq?.page();
    window.snaptr?.("track", "PAGE_VIEW");
  }, [location.pathname]);

  return null;
}
