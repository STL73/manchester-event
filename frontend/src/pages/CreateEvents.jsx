import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Button from "../components/UI/Button";
import FieldError from "../components/UI/FieldError";
import StatusMessage from "../components/UI/StatusMessage";
import { eventCategories, eventLocations } from "../data/eventsData";
import {
  allowedImageTypes,
  createEventForm,
  createEventMessages,
  editEventForm,
  eventFieldColumns,
  maxImageSize,
} from "../data/createEventsData";
import { organiserEventActions } from "../data/organiserEventsData";
import placeholder from "../images/events/placeholder.jpg";

const emptyForm = {
  eventName: "",
  startDatetime: "",
  endDatetime: "",
  description: "",
  categoryId: "",
  locationName: "",
  address: "",
  externalLink: "",
};

// datetime-local inputs need "YYYY-MM-DDTHH:mm"
function toInputDateTime(value) {
  return value ? value.slice(0, 16) : "";
}

// Fill the form from an existing event (edit mode)
function formFromEvent(event) {
  return {
    eventName: event.name ?? "",
    startDatetime: toInputDateTime(event.startDatetime),
    endDatetime: toInputDateTime(event.endDatetime),
    description: event.description ?? "",
    categoryId: event.categoryId ?? "",
    locationName: event.location ?? "",
    address: event.address ?? "",
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

// Mirrors validate_event_input() (the same checks on create and edit)
function validateEvent(form) {
  const errors = {};
  const requiredFields = [
    "eventName",
    "description",
    "startDatetime",
    "categoryId",
    "locationName",
    "address",
    "externalLink",
  ];

  requiredFields.forEach((field) => {
    if (!form[field].trim()) errors[field] = createEventMessages[field];
  });
  if (form.externalLink.trim() && !isValidUrl(form.externalLink.trim())) {
    errors.externalLink = createEventMessages.invalidUrl;
  }

  return errors;
}

// Turn the form into event fields
function eventFieldsFromForm(form) {
  const category = eventCategories.find(({ id }) => id === form.categoryId);
  const knownLocation = eventLocations.find(
    ({ name }) => name.toLowerCase() === form.locationName.trim().toLowerCase(),
  );

  return {
    name: form.eventName.trim(),
    description: form.description.trim(),
    startDatetime: form.startDatetime,
    endDatetime: form.endDatetime || null,
    categoryId: category.id,
    category: category.name,
    locationId: knownLocation?.id ?? null,
    location: form.locationName.trim(),
    address: form.address.trim(),
    externalLink: form.externalLink.trim(),
  };
}

// One page, two modes: Create Events (create_events.php) and, on
// /dashboard/my-events/:eventId/edit, Edit Event (edit_event.php).
// A new key per event resets the form when moving between edit pages.
export default function CreateEvents(props) {
  const { eventId } = useParams();
  return <EventFormPage key={eventId ?? "new"} {...props} />;
}

function EventFormPage({
  mode = "create",
  events = [],
  onCreateEvent,
  onUpdateEvent,
  onCancelEvent,
}) {
  const isEdit = mode === "edit";
  const { eventId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  // Only the organiser's own events can be edited
  const event = isEdit
    ? events.find((item) => String(item.eventId) === eventId)
    : null;

  const [form, setForm] = useState(() => (event ? formFromEvent(event) : emptyForm));
  const [imagePreview, setImagePreview] = useState("");
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const messageRef = useRef(null);
  const fileInputRef = useRef(null);
  const page = isEdit ? editEventForm : createEventForm;
  const HeadingIcon = page.headingIcon;
  const { saveDraft } = createEventForm;
  const { update, cancelEvent, goBack } = editEventForm;
  const { submitDraft: submitForApproval } = organiserEventActions;

  // Drafts keep Save as Draft / Submit for Approval; other events get
  // Update (back to pending, as in the PHP) and Cancel Event
  const isDraft = !isEdit || event?.status === "draft";
  const lockedMessage =
    event?.status === "past"
      ? createEventMessages.pastLocked
      : event?.status === "cancelled"
        ? createEventMessages.cancelledLocked
        : "";

  // Bring the success message into view after saving
  useEffect(() => {
    if (message) messageRef.current?.scrollIntoView({ block: "center" });
  }, [message]);

  function handleGoBack() {
    // "default" means this is the first page in the tab's history
    if (location.key === "default") navigate(editEventForm.goBackFallback);
    else navigate(-1);
  }

  function handleChange(changeEvent) {
    const { name, value } = changeEvent.target;
    setForm((current) => ({ ...current, [name]: value }));
    setMessage("");
  }

  function handleImageChange(changeEvent) {
    const [file] = changeEvent.target.files;
    setMessage("");
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview("");

    if (!file) return;

    // Mirrors the type and size checks in handle_event_image()
    const imageError = !allowedImageTypes.includes(file.type)
      ? createEventMessages.invalidImage
      : file.size > maxImageSize
        ? createEventMessages.imageTooLarge
        : "";

    if (imageError) {
      setErrors((current) => ({ ...current, image: imageError }));
      changeEvent.target.value = "";
      return;
    }

    setErrors((current) => ({ ...current, image: undefined }));
    setImagePreview(URL.createObjectURL(file));
  }

  function handleSubmit(submitEvent) {
    submitEvent.preventDefault();
    // The button that was pressed decides the status, as in the PHP
    const status =
      submitEvent.nativeEvent.submitter?.name === "saveDraft" ? "draft" : "pending";
    const nextErrors = validateEvent(form);

    setErrors(nextErrors);
    setMessage("");
    const firstInvalid = Object.keys(nextErrors)[0];
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus();
      return;
    }

    const fields = eventFieldsFromForm(form);

    if (isEdit) {
      // A new image replaces the current one (and its focal point, which was
      // chosen for the old photo); otherwise both are kept
      const image = imagePreview
        ? { image: imagePreview, imagePosition: undefined }
        : { image: event.image };
      onUpdateEvent(event.eventId, { ...fields, ...image }, status);
      setImagePreview("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setMessage(
        !isDraft
          ? createEventMessages.updatedForApproval
          : status === "pending"
            ? createEventMessages.submitted
            : createEventMessages.updated,
      );
      return;
    }

    onCreateEvent({ ...fields, image: imagePreview || placeholder, status });
    setForm(emptyForm);
    setImagePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    setMessage(createEventMessages.created);
  }

  // Matches the Cancel Event button in edit_event.php
  function handleCancelEvent() {
    if (!window.confirm(createEventMessages.confirmCancel)) return;
    onCancelEvent(event.eventId);
    navigate("/dashboard/my-events", {
      state: { message: createEventMessages.cancelled },
    });
  }

  function renderField(field) {
    const label = `${field.label}:${field.required ? " *" : ""}`;
    const errorId = `${field.id}-error`;
    const sharedProps = {
      id: field.id,
      name: field.id,
      "aria-invalid": Boolean(errors[field.id]),
      "aria-describedby": errors[field.id] ? errorId : undefined,
    };

    let control;
    if (field.type === "textarea") {
      control = (
        <textarea
          {...sharedProps}
          rows="5"
          placeholder={field.placeholder}
          value={form[field.id]}
          onChange={handleChange}
        />
      );
    } else if (field.type === "select") {
      control = (
        <select
          {...sharedProps}
          className="form-select"
          value={form[field.id]}
          onChange={handleChange}
        >
          <option value="">{field.placeholder}</option>
          {eventCategories.map(({ id, name }) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
      );
    } else if (field.type === "file") {
      control = (
        <input
          {...sharedProps}
          ref={fileInputRef}
          className="profile-file-input"
          type="file"
          accept={allowedImageTypes.join(",")}
          onChange={handleImageChange}
        />
      );
    } else {
      control = (
        <input
          {...sharedProps}
          type={field.type}
          placeholder={field.placeholder}
          value={form[field.id]}
          onChange={handleChange}
        />
      );
    }

    return (
      <div className="contact-field" key={field.id}>
        <label htmlFor={field.id}>{label}</label>
        {control}
        {errors[field.id] && (
          <FieldError id={errorId}>{errors[field.id]}</FieldError>
        )}
      </div>
    );
  }

  const shownImage = imagePreview || (isEdit ? event?.image : "");

  return (
    <div className="dashboard-home">
      <section
        className="dashboard-section"
        aria-labelledby="create-event-title"
      >
        <div className="section-heading-row">
          <h2 className="dashboard-title" id="create-event-title">
            <HeadingIcon className="dashboard-title-icon" aria-hidden="true" />
            {page.heading}
          </h2>
          {isEdit && (
            <Button type="button" variant="primary" size="sm" onClick={handleGoBack}>
              <goBack.icon aria-hidden="true" />
              {goBack.label}
            </Button>
          )}
        </div>

        {isEdit && !event ? (
          <div className="dashboard-empty-state">
            <p className="dashboard-empty-text">{createEventMessages.notFound}</p>
          </div>
        ) : lockedMessage ? (
          <StatusMessage variant="error" className="table-message">
            {lockedMessage}
          </StatusMessage>
        ) : (
          <div className="contact-form-container">
            <form className="contact-form" onSubmit={handleSubmit} noValidate>
              <h3 className="contact-form-title">{createEventForm.title}</h3>

              {message && (
                <StatusMessage ref={messageRef}>{message}</StatusMessage>
              )}

              <div className="profile-form-grid">
                {eventFieldColumns.map((column, index) => (
                  <div className="profile-form-column" key={index}>
                    {column.map(renderField)}
                  </div>
                ))}
              </div>

              <div className="event-image-preview">
                <p className="profile-legend">
                  {imagePreview
                    ? createEventForm.imagePreviewLabel
                    : page.imagePreviewLabel}
                </p>
                {shownImage ? (
                  <img
                    className="event-image-preview-img"
                    src={shownImage}
                    alt="Event image preview"
                  />
                ) : (
                  <div className="event-image-preview-empty">
                    <p className="dashboard-empty-text">No image selected</p>
                  </div>
                )}
              </div>

              <p className="content-p">{createEventForm.requiredNote}</p>

              <div className="dashboard-flex form-actions">
                {isDraft ? (
                  <>
                    <Button type="submit" name="saveDraft" variant="secondary" size="md">
                      <saveDraft.icon aria-hidden="true" />
                      {saveDraft.label}
                    </Button>
                    <Button type="submit" name="submit" variant="primary" size="md">
                      <submitForApproval.icon aria-hidden="true" />
                      {submitForApproval.label}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button type="submit" name="update" variant="primary" size="md">
                      <update.icon aria-hidden="true" />
                      {update.label}
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      size="md"
                      onClick={handleCancelEvent}
                    >
                      <cancelEvent.icon aria-hidden="true" />
                      {cancelEvent.label}
                    </Button>
                  </>
                )}
              </div>
            </form>
          </div>
        )}
      </section>
    </div>
  );
}
