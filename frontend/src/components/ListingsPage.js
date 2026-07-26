import { useEffect, useRef, useState } from "react";
import { fetchProperties } from "../api/client";
import PropertyCard from "./PropertyCard";
import PropertyFilters, { DEFAULT_FILTERS } from "./PropertyFilters";

const DEFAULT_PAGE_SIZE = 20;

function ListingsPage() {
  const [properties, setProperties] = useState([]);
  const [meta, setMeta] = useState({
    total: 0,
    limit: DEFAULT_PAGE_SIZE,
    offset: 0
  });
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const activeRequestRef = useRef(0);

  async function loadProperties(searchFilters = DEFAULT_FILTERS) {
    const requestId = activeRequestRef.current + 1;
    activeRequestRef.current = requestId;

    setIsLoading(true);
    setErrorMessage("");

    try {
      const data = await fetchProperties({
        ...searchFilters,
        limit: DEFAULT_PAGE_SIZE,
        offset: 0
      });

      if (activeRequestRef.current !== requestId) {
        return;
      }

      setProperties(Array.isArray(data.results) ? data.results : []);
      setMeta({
        total: Number(data.total) || 0,
        limit: Number(data.limit) || DEFAULT_PAGE_SIZE,
        offset: Number(data.offset) || 0
      });
    } catch (error) {
      if (activeRequestRef.current !== requestId) {
        return;
      }

      setProperties([]);
      setMeta({
        total: 0,
        limit: DEFAULT_PAGE_SIZE,
        offset: 0
      });
      setErrorMessage(error.message);
    } finally {
      if (activeRequestRef.current === requestId) {
        setIsLoading(false);
      }
    }
  }

  useEffect(() => {
    loadProperties(DEFAULT_FILTERS);
  }, []);

  function handleSearch(nextFilters) {
    loadProperties(nextFilters);
  }

  function handleClear(nextFilters) {
    loadProperties(nextFilters);
  }

  const visibleCount = properties.length;
  const startCount = meta.offset + (visibleCount > 0 ? 1 : 0);
  const endCount = meta.offset + visibleCount;

  return (
    <main className="page-shell">
      <section className="hero">
        <p className="hero__eyebrow">Week 6</p>
        <h1>Property Listings</h1>
        <p className="hero__description">
          Browse live property data pulled from the Express API and refine it with filters.
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

        <PropertyFilters
          filters={filters}
          onFiltersChange={setFilters}
          onSearch={handleSearch}
          onClear={handleClear}
          isLoading={isLoading}
        />

        {isLoading ? (
          <div className="status-card">Loading properties...</div>
        ) : null}

        {!isLoading && errorMessage ? (
          <div className="status-card status-card--error">{errorMessage}</div>
        ) : null}

        {!isLoading && !errorMessage ? (
          visibleCount > 0 ? (
            <div className="property-grid">
              {properties.map((property) => (
                <PropertyCard
                  key={property.listingId || property.id}
                  property={property}
                />
              ))}
            </div>
          ) : (
            <div className="status-card">
              No properties found for the current filters.
            </div>
          )
        ) : null}
      </section>
    </main>
  );
}

export default ListingsPage;
