/**
 * Contact Service Layer
 * 
 * API Contract:
 * POST /api/contact → submit contact form
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const USE_MOCK = !API_BASE_URL;

export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  message: string;
}

export async function submitContactForm(data: ContactFormData): Promise<{ success: boolean }> {
  if (USE_MOCK) {
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 500));
    console.log("Contact form submitted (mock):", data);
    return { success: true };
  }
  const res = await fetch(`${API_BASE_URL}/api/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to submit form");
  return res.json();
}
