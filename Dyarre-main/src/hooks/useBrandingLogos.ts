import { useEffect, useState } from 'react'
import { getPublicSetting } from '@/services/settingsService'

export interface BrandingLogos {
  logo_light_bg_url: string
  logo_dark_bg_url: string
}

export const DEFAULT_LOGOS: BrandingLogos = {
  logo_light_bg_url: '/branding/logo-light-bg-default.png',
  logo_dark_bg_url: '/branding/logo-dark-bg-default.png',
}

let cached: BrandingLogos | null = null

export function invalidateBrandingLogos() {
  cached = null
}

export function useBrandingLogos(): BrandingLogos {
  const [logos, setLogos] = useState<BrandingLogos>(cached ?? DEFAULT_LOGOS)

  useEffect(() => {
    let mounted = true
    if (cached) return
    getPublicSetting('branding_logos').then(v => {
      if (!mounted) return
      const val = (v ?? {}) as Partial<BrandingLogos>
      cached = {
        logo_light_bg_url: val.logo_light_bg_url || DEFAULT_LOGOS.logo_light_bg_url,
        logo_dark_bg_url: val.logo_dark_bg_url || DEFAULT_LOGOS.logo_dark_bg_url,
      }
      setLogos(cached)
    })
    return () => { mounted = false }
  }, [])

  return logos
}
