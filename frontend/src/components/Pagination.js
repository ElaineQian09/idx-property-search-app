const MAX_VISIBLE_PAGES = 7;

function buildPageItems(currentPage, totalPages) {
  if (totalPages <= MAX_VISIBLE_PAGES) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  // Always preserve the first, current, and last page; add a small window
  // around the current page or the nearest edge to keep controls compact.
  const pages = new Set([1, totalPages, currentPage]);

  if (currentPage <= 4) {
    [2, 3, 4, 5].forEach((page) => pages.add(page));
  } else if (currentPage >= totalPages - 3) {
    [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1].forEach(
      (page) => pages.add(page)
    );
  } else {
    [currentPage - 1, currentPage, currentPage + 1].forEach((page) =>
      pages.add(page)
    );
  }

  const sortedPages = Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((left, right) => left - right);

  const items = [];

  sortedPages.forEach((page, index) => {
    const previousPage = sortedPages[index - 1];

    // A gap between adjacent page numbers becomes one non-interactive ellipsis.
    if (index > 0 && page - previousPage > 1) {
      items.push(`ellipsis-${previousPage}-${page}`);
    }

    items.push(page);
  });

  return items;
}

function Pagination({ currentPage, totalPages, onPageChange, isLoading }) {
  if (totalPages <= 1) {
    return null;
  }

  const pageItems = buildPageItems(currentPage, totalPages);

  return (
    <nav className="pagination" aria-label="Pagination">
      <button
        className="button button--secondary pagination__button"
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={isLoading || currentPage === 1}
      >
        Previous
      </button>

      <div className="pagination__pages">
        {pageItems.map((item) =>
          typeof item === "string" ? (
            <span
              key={item}
              className="pagination__ellipsis"
              aria-hidden="true"
            >
              ...
            </span>
          ) : (
            <button
              key={item}
              className={`button pagination__page${
                item === currentPage ? " pagination__page--active" : ""
              }`}
              type="button"
              onClick={() => onPageChange(item)}
              disabled={isLoading}
              aria-current={item === currentPage ? "page" : undefined}
            >
              {item}
            </button>
          )
        )}
      </div>

      <button
        className="button button--secondary pagination__button"
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={isLoading || currentPage === totalPages}
      >
        Next
      </button>
    </nav>
  );
}

export default Pagination;
