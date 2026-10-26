// Every call to the backend goes through here. Answers arrive as { data } (a
// list adds { pagination }) or, on failure, { error: { message, details } },
// which becomes an ApiError the page can show

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export async function api(path, { method = "GET", body } = {}) {
  let response;
  try {
    response = await fetch(`/api/v1${path}`, {
      method,
      // Sends the session cookie with every request
      credentials: "include",
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "Can't reach the server. Check your connection and try again.");
  }

  // Logout and some deletes answer 204 with no body
  const payload = response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      response.status,
      payload?.error?.message ?? "Something went wrong",
      payload?.error?.details,
    );
  }
  return payload;
}
