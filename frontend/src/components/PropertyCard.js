import { getPrimaryPhotoUrl } from "../utils/propertyPhotos";

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
  const photoUrl = getPrimaryPhotoUrl(property.photos);

  return (
    <article className="property-card">
      <div className="property-card__image-wrapper">
        <img
          className="property-card__image"
          src={photoUrl}
          alt={formatAddress(property)}
        />
      </div>

      <div className="property-card__body">
        <p className="property-card__price">{formatPrice(property.price)}</p>
        <p className="property-card__address">{formatAddress(property)}</p>
        <p className="property-card__meta">{formatBedsBaths(property)}</p>
      </div>
    </article>
  );
}

export default PropertyCard;
