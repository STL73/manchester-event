// Two letters of a name in a filled hexagon, for people with no picture of
// their own here (Manage Users' rows and panel, a Contact Messages sender).
// Decorative: the name is always written beside it
export default function Avatar({ name, large = false }) {
  const initials = name.replace(/[^a-z]/gi, "").slice(0, 2).toUpperCase();

  return (
    <span className={`hex-fill tone-accent admin-avatar ${large ? "is-large" : ""}`} aria-hidden="true">
      {initials}
    </span>
  );
}
