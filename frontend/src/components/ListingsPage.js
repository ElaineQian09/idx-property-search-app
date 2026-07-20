import { useEffect, useState } from "react";
import { fetchProperties } from "../api/client";
import PropertyCard from "./PropertyCard";

function ListingsPage() {
  const [properties, setProperties] = useState([]);
  const [meta, setMeta] = useState({ total: 0, limit: 20, offset: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadProperties() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const data = await fetchProperties({ limit: 20, offset: 0 });

        if (!isMounted) {
          return;
        }

        setProperties(Array.isArray(data.results) ? data.results : []);
        setMeta({
          total: Number(data.total) || 0,
          limit: Number(data.limit) || 20,
          offset: Number(data.offset) || 0
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(error.message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadProperties();

    return () => {
      isMounted = false;
    };
  }, []);

  const visibleCount = properties.length;
  const startCount = meta.offset + (visibleCount > 0 ? 1 : 0);
  const endCount = meta.offset + visibleCount;

  return (
    <main className="page-shell">
      <section className="hero">
        <p className="hero__eyebrow">Week 5</p>
        <h1>Property Listings</h1>
        <p className="hero__description">
          Browse live property data pulled from the Express API.
        </p>
      </section>

      <section className="listings-panel">
        <div className="listings-panel__header">
          <div>
            <h2>Available Homes</h2>
            <p className="listings-panel__count">
              {visibleCount > 0
                ? `Showing ${startCount}-${endCount} of ${meta.total} properties`
                : `Showing 0 of ${meta.total} properties`}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="status-card">Loading properties...</div>
        ) : null}

        {!isLoading && errorMessage ? (
          <div className="status-card status-card--error">{errorMessage}</div>
        ) : null}

        {!isLoading && !errorMessage ? (
          <div className="property-grid">
            {properties.map((property) => (
              <PropertyCard
                key={property.listingId || property.id}
                property={property}
              />
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}

export default ListingsPage;
