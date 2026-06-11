import { useQuery } from '@tanstack/react-query'
import type { Property, UAECity, PropertyType, PropertyStatus, FurnishingStatus, CompletionStatus } from '@/data/mockData'
import placeholderImg from '@/assets/property-apartment.jpg'

const API = import.meta.env.VITE_API_BASE_URL

interface DbPropertyRow {
  id: string
  display_id: number
  reference_number: string | null
  title: string
  description: string | null
  type: string
  price: number
  city: string
  zone: string
  bedrooms: number
  bathrooms: number
  size: number
  status: string
  furnishing: string
  completion_status: string
  whatsapp_number: string | null
  google_map_url: string | null
  is_visible: boolean
  features: string[] | null
  developer: string | null
  created_at: string
  expiry_date: string | null
  listing_permit: string | null
  images?: string[]
}

export interface DbProperty extends Property {
  displayId: number
  referenceNumber: string | null
  developer?: string | null
  expiryDate?: string | null
}

function mapRow(row: DbPropertyRow): DbProperty {
  const images = row.images?.length ? row.images : [placeholderImg]
  return {
    id: row.id,
    displayId: row.display_id,
    referenceNumber: row.reference_number,
    title: row.title,
    description: row.description ?? '',
    type: row.type as PropertyType,
    price: Number(row.price) || 0,
    city: row.city as UAECity,
    zone: row.zone,
    location: row.city,
    area: row.zone,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    size: row.size,
    status: row.status as PropertyStatus,
    furnishing: row.furnishing as FurnishingStatus,
    completionStatus: row.completion_status as CompletionStatus,
    whatsappNumber: row.whatsapp_number || '971544444518',
    googleMapUrl: row.google_map_url || '',
    isVisible: row.is_visible,
    images,
    features: row.features ?? [],
    developer: row.developer,
    expiryDate: row.expiry_date,
    listing_permit: row.listing_permit ?? undefined,
    createdAt: row.created_at,
  }
}

async function fetchProperties(): Promise<DbProperty[]> {
  const res = await fetch(`${API}/api/properties`)
  if (!res.ok) throw new Error('Failed to fetch properties')
  const rows: DbPropertyRow[] = await res.json()
  return rows.map(mapRow)
}

export function useDbProperties() {
  return useQuery({
    queryKey: ['db-properties'],
    queryFn: fetchProperties,
    staleTime: 30_000,
    refetchInterval: 30_000,
  })
}

export function useDbProperty(id: string | undefined) {
  const { data, ...rest } = useDbProperties()
  const property = data?.find(p => p.id === id || String(p.displayId) === id)
  return { property, ...rest }
}
