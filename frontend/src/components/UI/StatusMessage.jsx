import { CircleAlert, CircleCheck } from "lucide-react";

// A message box: green with a tick for success, red with an alert for errors, so
// colour isn't the only difference (WCAG 1.4.1). `ref` is a plain prop in React 19
export default function StatusMessage({ variant = "success", className = "", ref, children }) {
  const Icon = variant === "error" ? CircleAlert : CircleCheck;

  return (
    <div
      ref={ref}
      className={`callout status-message ${variant === "error" ? "tone-danger" : "tone-success"} ${className}`.trim()}
      role="status"
    >
      <Icon aria-hidden="true" />
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  );
}
