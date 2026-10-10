import { ChevronLeft, ChevronRight } from "lucide-react";

// Page numbers to show: all of them up to 7, otherwise the first, the last
// and the ones either side of the current page, with gaps between
function pageItems(page, pageCount) {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const start = Math.max(2, page - 1);
  const end = Math.min(pageCount - 1, page + 1);
  const middle = Array.from({ length: end - start + 1 }, (_, index) => start + index);

  return [
    1,
    ...(start > 2 ? ["gap-start"] : []),
    ...middle,
    ...(end < pageCount - 1 ? ["gap-end"] : []),
    pageCount,
  ];
}

// Shared by Explore Events and, later, the dashboard tables. The parent owns
// the page (in the URL), so back, refresh and shared links keep it. Nothing
// shows when everything fits on one page
export default function Pagination({ page, pageCount, onPageChange, summary }) {
  if (pageCount <= 1) return null;

  return (
    <nav className="pagination" aria-label="Pagination">
      {summary && <p className="pagination-summary">{summary}</p>}
      <div className="pagination-controls">
        <button
          className="pagination-step"
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
        >
          <ChevronLeft aria-hidden="true" />
          <span className="pagination-step-label">Previous</span>
        </button>
        <ul className="pagination-pages">
          {pageItems(page, pageCount).map((item) =>
            typeof item === "number" ? (
              <li key={item}>
                <button
                  className={`pagination-page ${item === page ? "is-active" : ""}`}
                  type="button"
                  aria-label={`Page ${item}`}
                  aria-current={item === page ? "page" : undefined}
                  onClick={() => onPageChange(item)}
                >
                  {item}
                </button>
              </li>
            ) : (
              <li className="pagination-gap" aria-hidden="true" key={item}>
                …
              </li>
            ),
          )}
        </ul>
        <button
          className="pagination-step"
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page === pageCount}
        >
          <span className="pagination-step-label">Next</span>
          <ChevronRight aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
