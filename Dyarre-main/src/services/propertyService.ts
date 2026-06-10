/**
 * Property Service Layer
 * 
 * This module abstracts data fetching for properties.
 * Currently uses mock data — replace with API calls when backend is ready.
 * 
 * API Contract (for backend developer):
 * 
 * GET /api/properties           → list all visible properties (with filters as query params)
 * GET /api/properties/:id       → get single property by ID
 * GET /api/properties/featured  → get featured properties
 * GET /api/offplan              → get off-plan projects
 * GET /api/filters              → get dynamic filter options
 * POST /api/properties          → create property (admin)
 * PUT /api/properties/:id       → update property (admin)
 * DELETE /api/properties/:id    → delete property (admin)
 * POST /api/properties/:id/images → upload images (admin)
 */

import { properties, offPlanProjects, filterOptions, type Property, type PropertyType, type PropertyStatus, type FurnishingStatus } from "@/data/mockData";

// ============================================================
// Configure API base URL here when backend is ready
// ============================================================
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

// When API_BASE_URL is set, switch to real API calls
const USE_MOCK = !API_BASE_URL;

// ---------- Helper for future API calls ----------
async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || `API error ${res.status}`);
  }
  return res.json();
}

// ---------- Filters ----------
export interface PropertyFilters {
  type?: string;
  city?: string;
  zone?: string;
  area?: string;
  status?: string;
  bedrooms?: string;
  priceMin?: string;
  priceMax?: string;
  furnishing?: string;
}

export type SortOption = "newest" | "price-asc" | "price-desc";

// ---------- Public API ----------

export async function getProperties(filters: PropertyFilters = {}, sort: SortOption = "newest"): Promise<Property[]> {
  if (USE_MOCK) {
    let result = properties.filter((p) => p.isVisible);
    if (filters.type) result = result.filter((p) => p.type === filters.type);
    if (filters.city) result = result.filter((p) => p.city === filters.city);
    if (filters.zone) result = result.filter((p) => p.zone === filters.zone);
    if (filters.area) result = result.filter((p) => p.area === filters.area);
    if (filters.status) result = result.filter((p) => p.status === filters.status);
    if (filters.bedrooms) result = result.filter((p) => p.bedrooms === Number(filters.bedrooms));
    if (filters.priceMin) result = result.filter((p) => p.price >= Number(filters.priceMin));
    if (filters.priceMax) result = result.filter((p) => p.price <= Number(filters.priceMax));
    if (filters.furnishing) result = result.filter((p) => p.furnishing === filters.furnishing);

    switch (sort) {
      case "price-asc": result.sort((a, b) => a.price - b.price); break;
      case "price-desc": result.sort((a, b) => b.price - a.price); break;
      case "newest": result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
    }
    return result;
  }
  const params = new URLSearchParams();
  Object.entries({ ...filters, sort }).forEach(([k, v]) => { if (v) params.set(k, v); });
  return apiFetch<Property[]>(`/api/properties?${params}`);
}

export async function getPropertyById(id: string): Promise<Property | null> {
  if (USE_MOCK) return properties.find((p) => p.id === id) || null;
  return apiFetch<Property>(`/api/properties/${id}`);
}

export async function getFeaturedProperties(limit = 4): Promise<Property[]> {
  if (USE_MOCK) return properties.filter((p) => p.isVisible).slice(0, limit);
  return apiFetch<Property[]>(`/api/properties/featured?limit=${limit}`);
}

export async function getOffPlanProjects() {
  if (USE_MOCK) return offPlanProjects;
  return apiFetch(`/api/offplan`);
}

export async function getFilterOptions() {
  if (USE_MOCK) return filterOptions;
  return apiFetch(`/api/filters`);
}

// ---------- Admin Operations ----------

export async function createProperty(data: Omit<Property, "id" | "createdAt">): Promise<Property> {
  if (USE_MOCK) {
    const newProperty = { ...data, id: String(Date.now()), createdAt: new Date().toISOString() } as Property;
    properties.push(newProperty);
    return newProperty;
  }
  return apiFetch<Property>("/api/properties", { method: "POST", body: JSON.stringify(data) });
}

export async function updateProperty(id: string, data: Partial<Property>): Promise<Property> {
  if (USE_MOCK) {
    const idx = properties.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("Property not found");
    properties[idx] = { ...properties[idx], ...data };
    return properties[idx];
  }
  return apiFetch<Property>(`/api/properties/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function deleteProperty(id: string): Promise<void> {
  if (USE_MOCK) {
    const idx = properties.findIndex((p) => p.id === id);
    if (idx !== -1) properties.splice(idx, 1);
    return;
  }
  await apiFetch(`/api/properties/${id}`, { method: "DELETE" });
}

export async function togglePropertyVisibility(id: string): Promise<Property> {
  if (USE_MOCK) {
    const property = properties.find((p) => p.id === id);
    if (!property) throw new Error("Property not found");
    property.isVisible = !property.isVisible;
    return property;
  }
  return apiFetch<Property>(`/api/properties/${id}/toggle-visibility`, { method: "PATCH" });
}

export { type Property, type PropertyType, type PropertyStatus, type FurnishingStatus };
