import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

const API = import.meta.env.VITE_API_BASE_URL

function getVisitorId(): string {
  let id = localStorage.getItem('dyarre_visitor_id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('dyarre_visitor_id', id)
  }
  return id
}

export function usePageTracking() {
  const location = useLocation()
  const sessionStart = useRef(Date.now())

  useEffect(() => {
    sessionStart.current = Date.now()
    const params = new URLSearchParams(location.search)

    fetch(`${API}/api/analytics/pageview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        page: location.pathname,
        visitor_id: getVisitorId(),
        user_agent: navigator.userAgent,
        referrer: document.referrer || null,
        utmSource: params.get('utm_source') || undefined,
        utmMedium: params.get('utm_medium') || undefined,
        utmCampaign: params.get('utm_campaign') || undefined,
      }),
    }).catch(() => {})

    const handleUnload = () => {
      const duration = Math.round((Date.now() - sessionStart.current) / 1000)
      navigator.sendBeacon(
        `${API}/api/analytics/pageview`,
        JSON.stringify({
          page: location.pathname,
          visitor_id: getVisitorId(),
          session_duration: duration,
        })
      )
    }

    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [location.pathname])

  // Fire Meta Pixel PageView if available
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'PageView')
    }
  }, [location.pathname])
}
