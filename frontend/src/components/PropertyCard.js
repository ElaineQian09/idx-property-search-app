import { Link, useInRouterContext } from "react-router-dom";
import PropertyImageCarousel from "./PropertyImageCarousel";

function formatPrice(price) {
  const numericPrice = Number(price);

  if (!Number.isFinite(numericPrice)) {
    return "Price unavailable";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(numericPrice);
}

function formatAddress(property) {
  const parts = [
    property.address,
    [property.city, property.state].filter(Boolean).join(", "),
    property.zipcode
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" ") : "Address unavailable";
}

function formatBedsBaths(property) {
  const beds = property.beds ?? "N/A";
  const baths = property.baths ?? "N/A";

  return `${beds} bd • ${baths} ba`;
}

function PropertyCard({ property }) {
  const isInRouterContext = useInRouterContext();
  const listingId = property.listingId || property.id;
  const address = formatAddress(property);
  const photosValue = property.L_Photos || property.photos;
  const cardContent = (
    <>
      <PropertyImageCarousel photos={photosValue} alt={address} />

      <div className="property-card__body">
        <p className="property-card__price">{formatPrice(property.price)}</p>
        <p className="property-card__address">{address}</p>
        <p className="property-card__meta">{formatBedsBaths(property)}</p>
      </div>
    </>
  );

  return (
    <article className="property-card">
      {isInRouterContext && listingId ? (
        <Link className="property-card__link" to={`/property/${listingId}`}>
          {cardContent}
        </Link>
      ) : (
        cardContent
      )}
    </article>
  );
}

export default PropertyCard;
