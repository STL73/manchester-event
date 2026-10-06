import { CircleAlert } from "lucide-react";

// A form field's error message. The icon means the error isn't shown by red
// colour alone (WCAG 1.4.1). Give it the id the control's aria-describedby uses
export default function FieldError({ id, children }) {
  return (
    <p className="profile-error" id={id}>
      <CircleAlert aria-hidden="true" />
      {children}
    </p>
  );
}
