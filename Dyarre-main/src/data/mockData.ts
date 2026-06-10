import propertyApartment from "@/assets/property-apartment.jpg";
import propertyTownhouse from "@/assets/property-townhouse.jpg";
import propertyVilla from "@/assets/property-villa.jpg";
import propertyPenthouse from "@/assets/property-penthouse.jpg";
import propertyLand from "@/assets/property-land.jpg";
import offplanProject from "@/assets/offplan-project.jpg";

export type PropertyType = "Villa" | "Apartment" | "Townhouse" | "Land" | "Penthouse" | "Building";
export type PropertyStatus = "For Sale" | "For Rent" | "Off-plan";
export type FurnishingStatus = "Furnished" | "Semi-Furnished" | "Unfurnished";
export type CompletionStatus = "Ready" | "Under Construction" | "Off-plan";

export type UAECity = "Abu Dhabi" | "Dubai" | "Sharjah" | "Ajman" | "Ras Al Khaimah" | "Fujairah" | "Umm Al Quwain";

export const cityZones: Record<UAECity, string[]> = {
  "Abu Dhabi": [
    "Mohammed Bin Zayed City", "Khalifa City A", "Khalifa City B", "Al Reem Island",
    "Saadiyat Island", "Yas Island", "Al Raha Beach", "Al Mushrif", "Al Shamkha",
    "Al Reef", "Al Ghadeer", "Masdar City", "Al Maryah Island", "Corniche Area",
  ],
  "Dubai": [
    "Palm Jumeirah", "Downtown Dubai", "Dubai Marina", "Arabian Ranches",
    "Business Bay", "Emirates Hills", "Dubai Creek Harbour", "Al Barari",
    "JBR", "DIFC", "Dubai Hills Estate",
  ],
  "Sharjah": [
    "Al Majaz", "Al Nahda", "Al Khan", "Al Taawun", "Muwaileh",
    "University City", "Al Qasba", "Sharjah Waterfront City",
  ],
  "Ajman": [
    "Al Nuaimiya", "Al Rashidiya", "Emirates City", "Al Jurf", "Ajman Downtown",
  ],
  "Ras Al Khaimah": [
    "Al Hamra Village", "Mina Al Arab", "Al Marjan Island", "Dafan Al Nakheel",
  ],
  "Fujairah": [
    "Fujairah City", "Dibba", "Al Faseel", "Merashid",
  ],
  "Umm Al Quwain": [
    "Umm Al Quwain Marina", "Al Salamah", "Old Town",
  ],
};

export interface Property {
  id: string;
  title: string;
  description: string;
  type: PropertyType;
  price: number;
  city: UAECity;
  zone: string;
  location: string; // kept for backwards compat (= city)
  area: string; // kept for backwards compat (= zone)
  bedrooms: number;
  bathrooms: number;
  size: number;
  status: PropertyStatus;
  furnishing: FurnishingStatus;
  completionStatus: CompletionStatus;
  whatsappNumber: string;
  googleMapUrl: string;
  isVisible: boolean;
  images: string[];
  features: string[];
  createdAt: string;
}

export const properties: Property[] = [
  {
    id: "1",
    title: "Luxury Villa in Mohammed Bin Zayed City",
    description: "A stunning 5-bedroom villa in MBZ City featuring a private pool, landscaped gardens, and modern finishes. Spacious living areas with premium materials throughout. Located in a family-friendly community with parks and schools nearby.",
    type: "Villa",
    price: 5200000,
    city: "Abu Dhabi",
    zone: "Mohammed Bin Zayed City",
    location: "Abu Dhabi",
    area: "Mohammed Bin Zayed City",
    bedrooms: 5,
    bathrooms: 6,
    size: 7500,
    status: "For Sale",
    furnishing: "Furnished",
    completionStatus: "Ready",
    whatsappNumber: "+971544444518",
    googleMapUrl: "https://maps.google.com/?q=Mohammed+Bin+Zayed+City+Abu+Dhabi",
    isVisible: true,
    images: [propertyVilla, propertyPenthouse, propertyApartment],
    features: ["Private Pool", "Garden", "Smart Home", "Maid's Room", "Driver's Room", "Covered Parking"],
    createdAt: "2025-03-15",
  },
  {
    id: "2",
    title: "Waterfront Penthouse on Al Reem Island",
    description: "An exceptional penthouse on Al Reem Island with panoramic sea and city views. Floor-to-ceiling windows, private terrace, gourmet kitchen, and direct beach access. The pinnacle of Abu Dhabi waterfront living.",
    type: "Penthouse",
    price: 8900000,
    city: "Abu Dhabi",
    zone: "Al Reem Island",
    location: "Abu Dhabi",
    area: "Al Reem Island",
    bedrooms: 4,
    bathrooms: 5,
    size: 6200,
    status: "For Sale",
    furnishing: "Semi-Furnished",
    completionStatus: "Ready",
    whatsappNumber: "+971502345678",
    googleMapUrl: "https://maps.google.com/?q=Al+Reem+Island+Abu+Dhabi",
    isVisible: true,
    images: [propertyPenthouse, propertyApartment, propertyVilla],
    features: ["Sea View", "Private Terrace", "Concierge", "Gym", "Pool", "Beach Access"],
    createdAt: "2025-03-10",
  },
  {
    id: "3",
    title: "Modern Townhouse in Khalifa City A",
    description: "A beautifully designed 4-bedroom townhouse in Khalifa City A, featuring a private garden, community facilities, and a family-friendly environment. Modern interiors with high ceilings and natural light throughout.",
    type: "Townhouse",
    price: 3200000,
    city: "Abu Dhabi",
    zone: "Khalifa City A",
    location: "Abu Dhabi",
    area: "Khalifa City A",
    bedrooms: 4,
    bathrooms: 4,
    size: 3800,
    status: "For Sale",
    furnishing: "Unfurnished",
    completionStatus: "Ready",
    whatsappNumber: "+971503456789",
    googleMapUrl: "https://maps.google.com/?q=Khalifa+City+A+Abu+Dhabi",
    isVisible: true,
    images: [propertyTownhouse, propertyVilla, propertyApartment],
    features: ["Private Garden", "Community Pool", "Playground", "Covered Parking", "Storage Room"],
    createdAt: "2025-03-05",
  },
  {
    id: "4",
    title: "Sea View Apartment on Saadiyat Island",
    description: "A sophisticated 2-bedroom apartment on Saadiyat Island with stunning beach views. High-end finishes, built-in wardrobes, and access to world-class amenities including cultural district proximity.",
    type: "Apartment",
    price: 2800000,
    city: "Abu Dhabi",
    zone: "Saadiyat Island",
    location: "Abu Dhabi",
    area: "Saadiyat Island",
    bedrooms: 2,
    bathrooms: 2,
    size: 1600,
    status: "For Sale",
    furnishing: "Furnished",
    completionStatus: "Ready",
    whatsappNumber: "+971504567890",
    googleMapUrl: "https://maps.google.com/?q=Saadiyat+Island+Abu+Dhabi",
    isVisible: true,
    images: [propertyApartment, propertyPenthouse, propertyTownhouse],
    features: ["Beach View", "Built-in Wardrobes", "Balcony", "Gym", "Pool", "Beach Access"],
    createdAt: "2025-02-28",
  },
  {
    id: "5",
    title: "Development Land on Yas Island",
    description: "A rare opportunity to acquire prime residential land on Yas Island with full infrastructure. Zoned for luxury villa development near Yas Mall, Ferrari World, and the F1 circuit.",
    type: "Land",
    price: 12000000,
    city: "Abu Dhabi",
    zone: "Yas Island",
    location: "Abu Dhabi",
    area: "Yas Island",
    bedrooms: 0,
    bathrooms: 0,
    size: 15000,
    status: "For Sale",
    furnishing: "Unfurnished",
    completionStatus: "Ready",
    whatsappNumber: "+971505678901",
    googleMapUrl: "https://maps.google.com/?q=Yas+Island+Abu+Dhabi",
    isVisible: true,
    images: [propertyLand, propertyVilla],
    features: ["Corner Plot", "G+2 Permission", "Full Infrastructure", "Near Yas Mall"],
    createdAt: "2025-02-20",
  },
  {
    id: "6",
    title: "Studio Apartment — Al Raha Beach",
    description: "A smart studio apartment in Al Raha Beach offering excellent rental yields. Fully furnished with modern kitchen, built-in appliances, and waterfront community amenities.",
    type: "Apartment",
    price: 750000,
    city: "Abu Dhabi",
    zone: "Al Raha Beach",
    location: "Abu Dhabi",
    area: "Al Raha Beach",
    bedrooms: 0,
    bathrooms: 1,
    size: 550,
    status: "For Rent",
    furnishing: "Furnished",
    completionStatus: "Ready",
    whatsappNumber: "+971506789012",
    googleMapUrl: "https://maps.google.com/?q=Al+Raha+Beach+Abu+Dhabi",
    isVisible: true,
    images: [propertyApartment, propertyPenthouse],
    features: ["Waterfront View", "Built-in Appliances", "Gym", "Pool", "24h Security"],
    createdAt: "2025-02-15",
  },
  {
    id: "7",
    title: "The Bloom — Masdar City Off-Plan",
    description: "A new sustainable living development in Masdar City featuring 1-3 bedroom apartments with green technology. Expected completion Q4 2027. Early investor pricing with attractive payment plans.",
    type: "Apartment",
    price: 1350000,
    city: "Abu Dhabi",
    zone: "Masdar City",
    location: "Abu Dhabi",
    area: "Masdar City",
    bedrooms: 2,
    bathrooms: 2,
    size: 1200,
    status: "Off-plan",
    furnishing: "Unfurnished",
    completionStatus: "Off-plan",
    whatsappNumber: "+971507890123",
    googleMapUrl: "https://maps.google.com/?q=Masdar+City+Abu+Dhabi",
    isVisible: true,
    images: [offplanProject, propertyApartment, propertyPenthouse],
    features: ["Smart Home", "Solar Panels", "EV Charging", "Co-working Space", "Landscaped Gardens"],
    createdAt: "2025-03-18",
  },
  {
    id: "8",
    title: "Grand Villa on Al Maryah Island",
    description: "An architectural masterpiece on Al Maryah Island. This 6-bedroom villa features a private spa, temperature-controlled pool, and stunning views of the Abu Dhabi skyline.",
    type: "Villa",
    price: 18000000,
    city: "Abu Dhabi",
    zone: "Al Maryah Island",
    location: "Abu Dhabi",
    area: "Al Maryah Island",
    bedrooms: 6,
    bathrooms: 7,
    size: 12000,
    status: "For Sale",
    furnishing: "Furnished",
    completionStatus: "Ready",
    whatsappNumber: "+971508901234",
    googleMapUrl: "https://maps.google.com/?q=Al+Maryah+Island+Abu+Dhabi",
    isVisible: true,
    images: [propertyVilla, propertyLand, propertyPenthouse],
    features: ["Private Spa", "Heated Pool", "Skyline View", "Wine Cellar", "Staff Quarters", "Triple Garage"],
    createdAt: "2025-01-25",
  },
];

export const offPlanProjects = [
  {
    id: "op-1",
    title: "The Bloom Residences",
    developer: "Aldar Properties",
    location: "Masdar City, Abu Dhabi",
    priceFrom: 1200000,
    completion: "Q4 2027",
    image: offplanProject,
    units: "1-3 Bed Apartments",
  },
  {
    id: "op-2",
    title: "Saadiyat Grove",
    developer: "Aldar Properties",
    location: "Saadiyat Island, Abu Dhabi",
    priceFrom: 3500000,
    completion: "Q2 2028",
    image: propertyVilla,
    units: "4-6 Bed Villas",
  },
  {
    id: "op-3",
    title: "Yas Bay Waterfront",
    developer: "Miral",
    location: "Yas Island, Abu Dhabi",
    priceFrom: 1800000,
    completion: "Q1 2027",
    image: propertyApartment,
    units: "1-4 Bed Apartments",
  },
];

export const uaeCities: UAECity[] = [
  "Abu Dhabi", "Dubai", "Sharjah", "Ajman", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain",
];

export const filterOptions = {
  types: ["Villa", "Apartment", "Townhouse", "Land", "Penthouse", "Building"] as PropertyType[],
  cities: uaeCities,
  zones: cityZones,
  statuses: ["For Sale", "For Rent", "Off-plan"] as PropertyStatus[],
  bedrooms: [0, 1, 2, 3, 4, 5, 6],
  bathrooms: [1, 2, 3, 4, 5, 6, 7],
  furnishing: ["Furnished", "Semi-Furnished", "Unfurnished"] as FurnishingStatus[],
  completionStatuses: ["Ready", "Under Construction", "Off-plan"] as CompletionStatus[],
  // legacy
  locations: uaeCities as string[],
  areas: Object.values(cityZones).flat(),
};

export function formatPrice(price: number): string {
  if (price >= 1000000) {
    return `AED ${(price / 1000000).toFixed(1)}M`;
  }
  return `AED ${price.toLocaleString()}`;
}

export function formatPriceFull(price: number): string {
  return `AED ${price.toLocaleString()}`;
}
