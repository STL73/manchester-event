import { CircleAlert, CircleCheck } from "lucide-react";

// A form or page message box: green with a tick for success, red with an
// alert for errors. The icon means the two aren't told apart by colour alone
// (WCAG 1.4.1). Children can be text or several <p> lines (Settings).
// ref is a plain prop in React 19 (CreateEvents scrolls the message into view)
export default function StatusMessage({ variant = "success", className = "", ref, children }) {
  const Icon = variant === "error" ? CircleAlert : CircleCheck;

  return (
    <div
      ref={ref}
      className={`status-message status-message-${variant} ${className}`.trim()}
      role="status"
    >
      <Icon aria-hidden="true" />
      <div className="status-message-text">{children}</div>
    </div>
  );
}
