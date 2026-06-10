import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

function getVisitorId(): string {
  let id = localStorage.getItem("dyarre_visitor_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("dyarre_visitor_id", id);
  }
  return id;
}

export function usePageTracking() {
  const location = useLocation();
  const sessionStart = useRef(Date.now());

  useEffect(() => {
    sessionStart.current = Date.now();

    const trackVisit = async () => {
      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-visit`;
        await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            page_path: location.pathname,
            visitor_id: getVisitorId(),
            user_agent: navigator.userAgent,
            referrer: document.referrer || null,
          }),
        });
      } catch {
        // silent fail
      }
    };
    trackVisit();

    // Track session duration on page leave
    const handleUnload = () => {
      const duration = Math.round((Date.now() - sessionStart.current) / 1000);
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-visit`;
      navigator.sendBeacon(
        url,
        JSON.stringify({
          page_path: location.pathname,
          visitor_id: getVisitorId(),
          user_agent: navigator.userAgent,
          session_duration: duration,
        })
      );
    };

    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [location.pathname]);

  // Fire Meta Pixel PageView if available
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).fbq) {
      (window as any).fbq("track", "PageView");
    }
  }, [location.pathname]);
}
