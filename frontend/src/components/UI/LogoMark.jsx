import { useId } from "react";

// Same 24x24 grid as lucide, so it takes the same size classes as the icons
const HEXAGON =
  "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z";
const BEE = [
  "m8 2l1.88 1.88m4.24 0L16 2M9 7V6a3 3 0 1 1 6 0v1M5 7a3 3 0 1 0 2.2 5.1C9.1 10 12 7 12 7s2.9 3 4.8 5.1A3 3 0 1 0 19 7Zm2.56 5h8.87M7.5 17h9",
  "M15.5 10.7c.9.9 1.4 2.1 1.5 3.3c0 5.8-5 8-5 8s-5-2.2-5-8c.1-1.2.6-2.4 1.5-3.3",
];

// The Manchester worker bee cut out of a honeycomb cell. The bee is a mask,
// not a second colour, so the background shows through on any surface
export default function LogoMark({ className = "", ...props }) {
  // useId keeps each mask unique when the logo appears more than once
  const maskId = `logo-bee-${useId().replace(/[^\w-]/g, "")}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <mask id={maskId}>
        <path d={HEXAGON} fill="white" stroke="white" strokeWidth="2" strokeLinejoin="round" />
        <g
          fill="none"
          stroke="black"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          transform="translate(12 12.4) scale(0.66) translate(-12 -12)"
        >
          {BEE.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
      </mask>
      <rect width="24" height="24" fill="currentColor" mask={`url(#${maskId})`} />
    </svg>
  );
}
