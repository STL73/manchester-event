// A message from the API (GET /contact-messages) in the shape Contact
// Messages and Admin Home read: the pages, like the mock data before them,
// call the time it was sent `sentAt`
export function toContactMessage({ createdAt, ...message }) {
  return { ...message, sentAt: createdAt };
}
