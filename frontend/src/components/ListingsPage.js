import { useEffect, useRef, useState } from "react";
import { fetchProperties } from "../api/client";
import Pagination from "./Pagination";
import PropertyCard from "./PropertyCard";
import PropertyFilters, { DEFAULT_FILTERS } from "./PropertyFilters";

const DEFAULT_PAGE_SIZE = 20;

function ListingsPage() {
  const [properties, setProperties] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(DEFAULT_PAGE_SIZE);
  const [meta, setMeta] = useState({
    total: 0,
    limit: itemsPerPage,
    offset: 0
  });
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const activeRequestRef = useRef(0);
  const listingsPanelRef = useRef(null);

  async function loadProperties(
    searchFilters = DEFAULT_FILTERS,
    page = currentPage,
    pageSize = itemsPerPage
  ) {
    const requestId = activeRequestRef.current + 1;
    activeRequestRef.current = requestId;

    setIsLoading(true);
    setErrorMessage("");

    try {
      const data = await fetchProperties({
        ...searchFilters,
        limit: pageSize,
        offset: (page - 1) * pageSize
      });

      if (activeRequestRef.current !== requestId) {
        return;
      }

      setProperties(Array.isArray(data.results) ? data.results : []);
      setMeta({
        total: Number(data.total) || 0,
        limit: Number(data.limit) || pageSize,
        offset: Number(data.offset) || 0
      });
    } catch (error) {
      if (activeRequestRef.current !== requestId) {
        return;
      }

      setProperties([]);
      setMeta({
        total: 0,
        limit: pageSize,
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

  function handleFiltersChange(nextFilters) {
    setCurrentPage(1);
    setFilters(nextFilters);
  }

  function handleSearch(nextFilters) {
    const nextPage = 1;
    setAppliedFilters(nextFilters);
    setCurrentPage(nextPage);
    loadProperties(nextFilters, nextPage, itemsPerPage);
  }

  function handleClear(nextFilters) {
    const nextPage = 1;
    setAppliedFilters(nextFilters);
    setCurrentPage(nextPage);
    loadProperties(nextFilters, nextPage, itemsPerPage);
  }

  function handlePageChange(nextPage) {
    const totalPages = Math.ceil(meta.total / itemsPerPage);

    if (
      nextPage === currentPage ||
      nextPage < 1 ||
      nextPage > totalPages ||
      isLoading
    ) {
      return;
    }

    listingsPanelRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
    setCurrentPage(nextPage);
    loadProperties(appliedFilters, nextPage, itemsPerPage);
  }

  const visibleCount = properties.length;
  const startCount = meta.offset + (visibleCount > 0 ? 1 : 0);
  const endCount = meta.offset + visibleCount;
  const totalPages = Math.ceil(meta.total / itemsPerPage);

  return (
    <main className="page-shell">
      <section className="hero">
        <p className="hero__eyebrow">IDX Exchange</p>
        <h1>Property Listings</h1>
        <p className="hero__description">
          Browse live property data pulled from the Express API and refine it with filters.
        </p>
      </section>

      <section ref={listingsPanelRef} className="listings-panel">
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
          onFiltersChange={handleFiltersChange}
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
            <>
              <div className="property-grid">
                {properties.map((property) => (
                  <PropertyCard
                    key={property.listingId || property.id}
                    property={property}
                  />
                ))}
              </div>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                isLoading={isLoading}
              />
            </>
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
