import { useEffect, useState, useCallback } from 'react'
import type { WatermarkPreset } from '@/utils/watermark'

const API = import.meta.env.VITE_API_BASE_URL

export function useWatermarkPresets() {
  const [presets, setPresets] = useState<WatermarkPreset[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const token = localStorage.getItem('access_token')
    const res = await fetch(`${API}/api/watermark-presets`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) setPresets(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  return { presets, loading, reload: load }
}
