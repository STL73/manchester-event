import { useSearchParams } from "react-router-dom";

// The page's view, filters, sort and page live in the address, so a link or
// Back brings the same list back. A default is left out to keep it clean
export function useUrlParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  // { view: "pending", page: null }: null or "" removes a key. Answers the new
  // params for a page that has to know them before the address changes
  function setParams(changes, options) {
    const next = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([key, value]) => {
      if (value === null || value === "") next.delete(key);
      else next.set(key, String(value));
    });
    setSearchParams(next, options);
    return next;
  }

  // Page 1 is the default, so it isn't written
  function setPage(page) {
    return setParams({ page: page > 1 ? page : null });
  }

  return { searchParams, setParams, setPage, setSearchParams };
}

// ?page= as a number from 1 to pageCount; a typed 0, "abc" or 99 reads as the nearest page
export function readPage(searchParams, pageCount = Infinity) {
  return Math.min(Math.max(Number(searchParams.get("page")) || 1, 1), pageCount);
}
