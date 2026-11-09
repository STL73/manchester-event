// A theme colour's value from its CSS variable ("success" -> --color-success).
// Recharts needs values, not var(), and hex copies would drift from the theme
export function themeColour(token) {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(`--color-${token}`)
    .trim();
}
