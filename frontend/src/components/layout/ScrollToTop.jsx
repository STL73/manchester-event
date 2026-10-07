import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// BrowserRouter keeps the scroll position between pages, so a link clicked
// in the footer would open the next page scrolled to its bottom. Only the
// path counts: a filter change on the same page (?when=...) stays in place
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
