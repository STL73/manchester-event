import { Hexagon } from "lucide-react";

// A short row of honeycomb cells between sections, in place of a plain rule
export default function HoneycombDivider({ className = "" }) {
  return (
    <div className={`honeycomb-divider ${className}`} aria-hidden="true">
      <Hexagon />
      <Hexagon />
      <Hexagon />
    </div>
  );
}
