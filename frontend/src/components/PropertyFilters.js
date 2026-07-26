const DEFAULT_FILTERS = {
  city: "",
  zipcode: "",
  minPrice: "",
  maxPrice: "",
  beds: "",
  baths: ""
};

const BED_OPTIONS = ["", "1", "2", "3", "4", "5"];
const BATH_OPTIONS = ["", "1", "1.5", "2", "2.5", "3", "4"];

function sanitizeFilters(filters) {
  const nextFilters = {};

  Object.entries(filters).forEach(([key, value]) => {
    if (typeof value === "string") {
      const trimmedValue = value.trim();

      if (trimmedValue !== "") {
        nextFilters[key] = trimmedValue;
      }

      return;
    }

    if (value !== undefined && value !== null && value !== "") {
      nextFilters[key] = value;
    }
  });

  return nextFilters;
}

function PropertyFilters({
  filters,
  onFiltersChange,
  onSearch,
  onClear,
  isLoading
}) {
  function handleChange(event) {
    const { name, value } = event.target;

    onFiltersChange({
      ...filters,
      [name]: value
    });
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSearch(sanitizeFilters(filters));
  }

  function handleClear() {
    onFiltersChange(DEFAULT_FILTERS);
    onClear(DEFAULT_FILTERS);
  }

  return (
    <form className="filters-form" onSubmit={handleSubmit}>
      <div className="filters-form__grid">
        <label className="filters-form__field">
          <span>City</span>
          <input
            name="city"
            type="text"
            value={filters.city}
            onChange={handleChange}
            placeholder="Portland"
          />
        </label>

        <label className="filters-form__field">
          <span>ZIP Code</span>
          <input
            name="zipcode"
            type="text"
            value={filters.zipcode}
            onChange={handleChange}
            placeholder="97201"
          />
        </label>

        <label className="filters-form__field">
          <span>Min Price</span>
          <input
            name="minPrice"
            type="number"
            min="0"
            value={filters.minPrice}
            onChange={handleChange}
            placeholder="300000"
          />
        </label>

        <label className="filters-form__field">
          <span>Max Price</span>
          <input
            name="maxPrice"
            type="number"
            min="0"
            value={filters.maxPrice}
            onChange={handleChange}
            placeholder="900000"
          />
        </label>

        <label className="filters-form__field">
          <span>Beds</span>
          <select name="beds" value={filters.beds} onChange={handleChange}>
            <option value="">Any</option>
            {BED_OPTIONS.filter(Boolean).map((option) => (
              <option key={option} value={option}>
                {option}+
              </option>
            ))}
          </select>
        </label>

        <label className="filters-form__field">
          <span>Baths</span>
          <select name="baths" value={filters.baths} onChange={handleChange}>
            <option value="">Any</option>
            {BATH_OPTIONS.filter(Boolean).map((option) => (
              <option key={option} value={option}>
                {option}+
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="filters-form__actions">
        <button className="button button--primary" type="submit" disabled={isLoading}>
          Search
        </button>
        <button
          className="button button--secondary"
          type="button"
          onClick={handleClear}
          disabled={isLoading}
        >
          Clear Filters
        </button>
      </div>
    </form>
  );
}

export { DEFAULT_FILTERS };
export default PropertyFilters;
