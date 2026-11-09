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

// The server's refusals by field, { email: "Email already in use" }: its paths
// name the part of the request too ("body.email"), which a form doesn't need
export function fieldErrors(error) {
  return Object.fromEntries(
    (error?.details ?? []).map(({ path, message }) => [path.replace(/^(body|query|params)\./, ""), message]),
  );
}

// A form with a photo: the file under its field's name and the rest
// of the form as JSON in `data`, which the server reads back as the usual body
export function formWithFile(field, file, fields) {
  const form = new FormData();
  if (fields !== undefined) form.append("data", JSON.stringify(fields));
  form.append(field, file);
  return form;
}

// One request to the backend; answers its data, or throws an ApiError
export async function api(path, { method = "GET", body } = {}) {
  // FormData goes as it is: the browser sets the multipart header and boundary
  const isForm = body instanceof FormData;
  let response;
  try {
    response = await fetch(`/api/v1${path}`, {
      method,
      // Sends the session cookie with every request
      credentials: "include",
      headers: body === undefined || isForm ? undefined : { "Content-Type": "application/json" },
      body: body === undefined || isForm ? body : JSON.stringify(body),
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
