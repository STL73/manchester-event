import { createEventMessages } from "../data/createEventsData";
import { fieldErrors } from "./api";
import { toLondonInput } from "./organiserEvents";

// Create / Edit Event's form without React: its empty state, the form from an
// event, the checks before saving, the body the API takes and the server's
// refusals under the form's names
export const emptyForm = {
  eventName: "",
  categoryId: "",
  description: "",
  startDatetime: "",
  endDatetime: "",
  // The OpenStreetMap id of the venue picked in VenueSearch
  placeId: "",
  externalLink: "",
};

const requiredFields = Object.keys(emptyForm).filter((field) => field !== "endDatetime");

// Fill the form from an existing event (edit mode). Times as a Manchester
// clock shows them, which is what the datetime-local inputs hold
export function formFromEvent(event) {
  return {
    eventName: event.name ?? "",
    categoryId: event.categoryId ?? "",
    description: event.description ?? "",
    startDatetime: toLondonInput(event.startDatetime),
    endDatetime: toLondonInput(event.endDatetime),
    placeId: event.venue?.placeId ?? "",
    externalLink: event.externalLink ?? "",
  };
}

function isValidUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

// The form's checks: every field but the end, a real link, the end after the
// start, and no start already passed when submitting one that is new or changed
export function validateEvent(form, { submitting, originalStart }) {
  const errors = {};

  requiredFields.forEach((field) => {
    if (!form[field].trim()) errors[field] = createEventMessages[field];
  });
  if (form.externalLink.trim() && !isValidUrl(form.externalLink.trim())) {
    errors.externalLink = createEventMessages.invalidUrl;
  }
  if (form.startDatetime && form.endDatetime && form.endDatetime <= form.startDatetime) {
    errors.endDatetime = createEventMessages.endBeforeStart;
  }
  const startIsNew = !originalStart || form.startDatetime !== originalStart;
  if (submitting && form.startDatetime && startIsNew && new Date(form.startDatetime) < new Date()) {
    errors.startDatetime = createEventMessages.startInPast;
  }

  return errors;
}

// The form as the API takes it (POST /events, PUT /events/:id). There is no
// status: `submit` says which button was pressed and the server decides
export function bodyFromForm(form, submit) {
  return {
    eventName: form.eventName.trim(),
    category: form.categoryId,
    description: form.description.trim(),
    startDatetime: form.startDatetime,
    endDatetime: form.endDatetime || null,
    placeId: form.placeId,
    ticketUrl: form.externalLink.trim(),
    submit,
  };
}

// The API names some fields differently from the form
const formFieldFor = { category: "categoryId", ticketUrl: "externalLink" };

// The server's refusal under the form's own names (ticketUrl -> externalLink)
export function errorsFromServer(error) {
  return Object.fromEntries(
    Object.entries(fieldErrors(error)).map(([field, message]) => [formFieldFor[field] ?? field, message]),
  );
}
