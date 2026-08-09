function parseCoordinate(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function buildLatLng(property) {
  const latitude = parseCoordinate(property?.LMD_MP_Latitude || property?.latitude);
  const longitude = parseCoordinate(
    property?.LMD_MP_Longitude || property?.longitude
  );

  if (latitude === null || longitude === null) {
    return null;
  }

  return `${latitude},${longitude}`;
}

function PropertyMap({ property }) {
  const latLng = buildLatLng(property);
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_EMBED_API_KEY;
  const directionsHref = latLng
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(latLng)}`
    : null;

  if (!latLng) {
    return (
      <section className="detail-section detail-section--grid">
        <h3>Map</h3>
        <p className="detail-section__body">Map unavailable for this property.</p>
      </section>
    );
  }

  if (!apiKey) {
    return (
      <section className="detail-section detail-section--grid">
        <h3>Map</h3>
        <p className="detail-section__body">
          Add <code>REACT_APP_GOOGLE_MAPS_EMBED_API_KEY</code> to enable the map embed.
        </p>
      </section>
    );
  }

  const src = `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(
    apiKey
  )}&q=${encodeURIComponent(latLng)}`;

  return (
    <section className="detail-section detail-section--grid">
      <h3>Map</h3>
      <div className="property-map">
        <iframe
          className="property-map__frame"
          title={`Map for ${latLng}`}
          src={src}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <a
        className="property-map__directions"
        href={directionsHref}
        target="_blank"
        rel="noreferrer"
      >
        Get Directions
      </a>
    </section>
  );
}

export default PropertyMap;
