// Something@something.something: enough to catch a typo before sending. The
// server checks the address properly (Zod, and Arcjet for sign-up and Contact)
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Whether a value looks like an email address
export function isEmail(value) {
  return EMAIL_PATTERN.test(value);
}
