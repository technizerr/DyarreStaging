import { useState, useEffect } from 'react'
import { getPublicSetting } from '@/services/settingsService'

export interface SocialLinks {
  instagram?: string
  tiktok?: string
  facebook?: string
  twitter?: string
  linkedin?: string
  youtube?: string
}

export function useSocialLinks() {
  const [links, setLinks] = useState<SocialLinks>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPublicSetting('social_media').then(v => {
      if (v && typeof v === 'object') setLinks(v as SocialLinks)
      setLoading(false)
    })
  }, [])

  const activeLinks = Object.entries(links).filter(([, url]) => url && url.trim() !== '')

  return { links, activeLinks, loading }
}
