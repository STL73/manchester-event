// A theme colour's value, read from the CSS variable Tailwind makes for each
// token in the App.css @theme block ("success" -> --color-success). Recharts
// draws SVG and takes colours as values, not classes, and var() in an SVG
// colour attribute isn't safe in every browser, so charts read the value here
// instead of keeping hex copies that drift from the theme
export function themeColour(token) {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(`--color-${token}`)
    .trim();
}
