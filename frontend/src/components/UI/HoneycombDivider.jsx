import { Hexagon } from "lucide-react";

// A short row of honeycomb cells between sections, in place of a plain rule
export default function HoneycombDivider() {
  return (
    <div className="honeycomb-divider" aria-hidden="true">
      <Hexagon />
      <Hexagon />
      <Hexagon />
    </div>
  );
}
