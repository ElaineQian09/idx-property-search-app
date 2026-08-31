import { useCallback, useEffect, useRef, useState } from "react";
import { fetchProperties } from "../api/client";
import useDocumentTitle from "../hooks/useDocumentTitle";
import Pagination from "../components/Pagination";
import PropertyCard from "../components/PropertyCard";
import PropertyFilters, { DEFAULT_FILTERS } from "../components/PropertyFilters";

const DEFAULT_PAGE_SIZE = 20;
const SORT_OPTIONS = [
  { value: "", label: "Default Order" },
  { value: "L_SystemPrice", label: "Price" },
  { value: "OnMarketDate", label: "Date Listed" },
  { value: "LM_Int2_3", label: "Square Feet" },
  { value: "L_Keyword2", label: "Beds" }
];
const SORT_ORDER_OPTIONS = [
  { value: "asc", label: "Ascending" },
  { value: "desc", label: "Descending" }
];
const DEFAULT_SORT = {
  sortBy: "",
  sortOrder: "asc"
};

function ListingsPage() {
  useDocumentTitle("Property Listings");
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
  const [appliedSort, setAppliedSort] = useState(DEFAULT_SORT);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const activeRequestRef = useRef(0);
  const initialLoadRef = useRef(false);
  const listingsPanelRef = useRef(null);

  const loadProperties = useCallback(async (
    searchFilters = DEFAULT_FILTERS,
    page = currentPage,
    pageSize = itemsPerPage,
    sortState = appliedSort
  ) => {
    const requestId = activeRequestRef.current + 1;
    activeRequestRef.current = requestId;

    setIsLoading(true);
    setErrorMessage("");

    try {
      const requestSort =
        sortState.sortBy !== ""
          ? {
              sortBy: sortState.sortBy,
              sortOrder: sortState.sortOrder
            }
          : {};

      const data = await fetchProperties({
        ...searchFilters,
        ...requestSort,
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
  }, [appliedSort, currentPage, itemsPerPage]);

  useEffect(() => {
    if (initialLoadRef.current) {
      return;
    }

    initialLoadRef.current = true;
    loadProperties(DEFAULT_FILTERS, 1, itemsPerPage, DEFAULT_SORT);
  }, [itemsPerPage, loadProperties]);

  function handleFiltersChange(nextFilters) {
    setCurrentPage(1);
    setFilters(nextFilters);
  }

  function handleSearch(nextFilters) {
    const nextPage = 1;
    setAppliedFilters(nextFilters);
    setAppliedSort(DEFAULT_SORT);
    setCurrentPage(nextPage);
    loadProperties(nextFilters, nextPage, itemsPerPage, DEFAULT_SORT);
  }

  function handleClear(nextFilters) {
    const nextPage = 1;
    setAppliedFilters(nextFilters);
    setAppliedSort(DEFAULT_SORT);
    setCurrentPage(nextPage);
    loadProperties(nextFilters, nextPage, itemsPerPage, DEFAULT_SORT);
  }

  function handleSortChange(nextSort) {
    const normalizedSort = nextSort.sortBy
      ? nextSort
      : DEFAULT_SORT;
    const nextPage = 1;

    setAppliedSort(normalizedSort);
    setCurrentPage(nextPage);
    loadProperties(appliedFilters, nextPage, itemsPerPage, normalizedSort);
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
    loadProperties(appliedFilters, nextPage, itemsPerPage, appliedSort);
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

          <div className="sort-controls" aria-label="Sort listings">
            <label className="sort-controls__field">
              <span>Sort By</span>
              <select
                name="sortBy"
                value={appliedSort.sortBy}
                onChange={(event) =>
                  handleSortChange({
                    sortBy: event.target.value,
                    sortOrder: appliedSort.sortOrder
                  })
                }
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value || "default"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="sort-controls__field">
              <span>Direction</span>
              <select
                name="sortOrder"
                value={appliedSort.sortOrder}
                onChange={(event) =>
                  handleSortChange({
                    sortBy: appliedSort.sortBy,
                    sortOrder: event.target.value
                  })
                }
                disabled={!appliedSort.sortBy}
              >
                {SORT_ORDER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
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
