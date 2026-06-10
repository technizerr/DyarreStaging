import { Link } from "react-router-dom";
import { type Property, formatPrice } from "@/data/mockData";
import { Bed, Bath, Maximize, MapPin } from "lucide-react";

interface PropertyCardProps {
  property: Property;
  variant?: "grid" | "list";
}

export function PropertyCard({ property, variant = "grid" }: PropertyCardProps) {
  if (variant === "list") {
    return (
      <Link
        to={`/property/${property.id}`}
        className="group flex flex-col sm:flex-row bg-card rounded-md overflow-hidden border border-border shadow-sm hover:shadow-lg transition-shadow duration-300"
      >
        <div className="sm:w-72 lg:w-80 h-48 sm:h-auto overflow-hidden shrink-0">
          <img
            src={property.images[0]}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
            loading="lazy"
          />
        </div>
        <div className="flex-1 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider text-accent">{property.type}</span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs font-medium text-muted-foreground">{property.status}</span>
            </div>
            <h3 className="text-lg font-display font-semibold text-foreground mb-1 line-clamp-1">{property.title}</h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mb-3">
              <MapPin className="w-3.5 h-3.5" /> {property.zone}, {property.city}
            </p>
            <p className="text-sm text-muted-foreground line-clamp-2">{property.description}</p>
          </div>
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {property.bedrooms > 0 && (
                <span className="flex items-center gap-1"><Bed className="w-4 h-4" /> {property.bedrooms}</span>
              )}
              {property.bathrooms > 0 && (
                <span className="flex items-center gap-1"><Bath className="w-4 h-4" /> {property.bathrooms}</span>
              )}
              <span className="flex items-center gap-1"><Maximize className="w-4 h-4" /> {property.size.toLocaleString()} sqft</span>
            </div>
            <span className="text-lg font-display font-semibold text-foreground">{formatPrice(property.price)}</span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/property/${property.id}`}
      className="group bg-card rounded-md overflow-hidden border border-border shadow-sm hover:shadow-lg transition-shadow duration-300"
    >
      <div className="aspect-[4/3] overflow-hidden relative">
        <img
          src={property.images[0]}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="px-2.5 py-1 text-xs font-medium bg-card/90 backdrop-blur-sm rounded text-foreground">{property.status}</span>
        </div>
      </div>
      <div className="p-5">
        <span className="text-xs font-medium uppercase tracking-wider text-accent">{property.type}</span>
        <h3 className="mt-1 text-base font-display font-semibold text-foreground line-clamp-1">{property.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5" /> {property.zone}, {property.city}
        </p>
        <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {property.bedrooms > 0 && (
              <span className="flex items-center gap-1"><Bed className="w-3.5 h-3.5" /> {property.bedrooms}</span>
            )}
            {property.bathrooms > 0 && (
              <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" /> {property.bathrooms}</span>
            )}
            <span className="flex items-center gap-1"><Maximize className="w-3.5 h-3.5" /> {property.size.toLocaleString()}</span>
          </div>
          <span className="font-display font-semibold text-foreground">{formatPrice(property.price)}</span>
        </div>
      </div>
    </Link>
  );
}
