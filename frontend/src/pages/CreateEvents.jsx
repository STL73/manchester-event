import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { CircleCheck, Circle } from "lucide-react";
import Button from "../components/UI/Button";
import FieldError from "../components/UI/FieldError";
import StatusMessage from "../components/UI/StatusMessage";
import EventCard from "../components/events/EventCard";
import DashboardPageHeading from "../components/dashboard/DashboardPageHeading";
import EmptyState from "../components/UI/EmptyState";
import { eventCategories, eventDetailsPage, eventLocations, hasBeenPublic } from "../data/eventsData";
import {
  afterSave,
  allowedImageTypes,
  createEventForm,
  createEventMessages,
  dangerZone,
  editBanners,
  editEventForm,
  eventFormGroups,
  imageDrop,
  maxImageSize,
  submitChecklist,
} from "../data/createEventsData";
import placeholder from "../images/events/placeholder.jpg";

const emptyForm = {
  eventName: "",
  categoryId: "",
  description: "",
  startDatetime: "",
  endDatetime: "",
  locationId: "",
  address: "",
  externalLink: "",
};

const requiredFields = Object.keys(emptyForm).filter((field) => field !== "endDatetime");

const editedFormatter = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });

// datetime-local inputs need "YYYY-MM-DDTHH:mm"
function toInputDateTime(value) {
  return value ? value.slice(0, 16) : "";
}

// Fill the form from an existing event (edit mode)
function formFromEvent(event) {
  return {
    eventName: event.name ?? "",
    categoryId: event.categoryId ?? "",
    description: event.description ?? "",
    startDatetime: toInputDateTime(event.startDatetime),
    endDatetime: toInputDateTime(event.endDatetime),
    locationId: event.locationId ?? "",
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

// validate_event_input()'s checks (every field but the end is required, the
// link must be a URL) plus the schema's date rules: the end comes after the
// start, and an event can't be submitted with a start that has passed
// (a draft may keep one; checked when the start is new or changed)
function validateEvent(form, { submitting, originalStart }) {
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

// Turn the form into event fields
function eventFieldsFromForm(form) {
  const category = eventCategories.find(({ id }) => id === form.categoryId);
  const area = eventLocations.find(({ id }) => id === form.locationId);

  return {
    name: form.eventName.trim(),
    description: form.description.trim(),
    startDatetime: form.startDatetime,
    endDatetime: form.endDatetime || null,
    categoryId: category.id,
    category: category.name,
    locationId: area.id,
    location: area.name,
    address: form.address.trim(),
    externalLink: form.externalLink.trim(),
  };
}

// One page, two modes: Create Event (create_events.php) and, on
// /dashboard/my-events/:eventId/edit, Edit Event (edit_event.php).
// A new key per event resets the form when moving between edit pages.
export default function CreateEvents(props) {
  const { eventId } = useParams();
  return <EventFormPage key={eventId ?? "new"} {...props} />;
}

// The photo box: drop or click to choose; once chosen the photo fills it,
// with Replace and Remove
function ImageDrop({ image, error, inputRef, onFile, onRemove }) {
  const [isDragging, setIsDragging] = useState(false);
  const errorId = "image-error";

  function handleDrop(dropEvent) {
    dropEvent.preventDefault();
    setIsDragging(false);
    const [file] = dropEvent.dataTransfer.files;
    if (file) onFile(file);
  }

  return (
    <div
      className={`event-image-drop ${image ? "has-image" : ""} ${isDragging ? "is-dragging" : ""}`}
      onDragOver={(dragEvent) => {
        dragEvent.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      {image ? (
        <img className="event-image-drop-photo" src={image} alt="" />
      ) : (
        <div className="event-image-drop-empty" aria-hidden="true">
          <imageDrop.icon />
          <strong>{imageDrop.title}</strong>
          {imageDrop.types}
        </div>
      )}
      {/* Covers the empty box, so a click anywhere opens the file picker */}
      <input
        ref={inputRef}
        id="image"
        className="event-image-drop-input"
        type="file"
        accept={allowedImageTypes.join(",")}
        aria-label={`${imageDrop.title}. ${imageDrop.types}`}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        tabIndex={image ? -1 : 0}
        onChange={(changeEvent) => {
          const [file] = changeEvent.target.files;
          if (file) onFile(file);
          changeEvent.target.value = "";
        }}
      />
      {image && (
        <div className="event-image-drop-tools">
          <Button type="button" variant="secondary" size="sm" onClick={() => inputRef.current?.click()}>
            <imageDrop.replace.icon aria-hidden="true" />
            {imageDrop.replace.label}
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={onRemove}>
            <imageDrop.remove.icon aria-hidden="true" />
            {imageDrop.remove.label}
          </Button>
        </div>
      )}
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  );
}

function EventFormPage({
  mode = "create",
  events = [],
  onCreateEvent,
  onUpdateEvent,
  onCancelEvent,
  onDeleteEvent,
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
  // The photo shown: the event's own, a new pick (an object URL) or none
  const [image, setImage] = useState(() => event?.image ?? "");
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  // "cancel" or "delete" while the danger zone asks
  const [confirming, setConfirming] = useState(false);
  const messageRef = useRef(null);
  const fileInputRef = useRef(null);
  const page = isEdit ? editEventForm : createEventForm;
  const HeadingIcon = page.headingIcon;
  const { saveDraft, submit } = createEventForm;
  const { resubmit, goBack } = editEventForm;

  // Drafts get Save draft and Submit; anything else goes back to an admin
  const isDraft = !isEdit || event?.status === "draft";
  const lockedMessage =
    event?.status === "past"
      ? createEventMessages.pastLocked
      : event?.status === "cancelled"
        ? createEventMessages.cancelledLocked
        : "";

  // Bring a message into view after saving
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

  // Mirrors the type and size checks in handle_event_image()
  function handleImageFile(file) {
    setMessage("");
    const imageError = !allowedImageTypes.includes(file.type)
      ? createEventMessages.invalidImage
      : file.size > maxImageSize
        ? createEventMessages.imageTooLarge
        : "";

    setErrors((current) => ({ ...current, image: imageError || undefined }));
    if (imageError) return;
    if (image.startsWith("blob:")) URL.revokeObjectURL(image);
    setImage(URL.createObjectURL(file));
  }

  function handleImageRemove() {
    if (image.startsWith("blob:")) URL.revokeObjectURL(image);
    setImage("");
    requestAnimationFrame(() => fileInputRef.current?.focus());
  }

  function handleSubmit(submitEvent) {
    submitEvent.preventDefault();
    // The button that was pressed decides the status, as in the PHP
    const status =
      submitEvent.nativeEvent.submitter?.name === "saveDraft" ? "draft" : "pending";
    const nextErrors = validateEvent(form, {
      submitting: status === "pending",
      originalStart: event ? toInputDateTime(event.startDatetime) : "",
    });

    setErrors(nextErrors);
    setMessage("");
    const firstInvalid = Object.keys(nextErrors)[0];
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus();
      return;
    }

    // A new photo drops the old one's focal point, chosen for that photo
    const photo = {
      image: image || placeholder,
      imagePosition: image && image === event?.image ? event.imagePosition : undefined,
    };
    const fields = { ...eventFieldsFromForm(form), ...photo };

    if (isEdit) {
      onUpdateEvent(event.eventId, fields, status);
      if (status === "draft") {
        setMessage(createEventMessages.draftSaved);
        return;
      }
      navigate(afterSave.pendingPath, {
        state: { message: isDraft ? createEventMessages.submitted : createEventMessages.resubmitted },
      });
      return;
    }

    onCreateEvent({ ...fields, status });
    navigate(status === "draft" ? afterSave.draftsPath : afterSave.pendingPath, {
      state: { message: status === "draft" ? createEventMessages.createdDraft : createEventMessages.submitted },
    });
  }

  // Matches the Cancel Event button in edit_event.php, asked in the page
  function handleDangerConfirm(kind) {
    if (kind === "cancel") {
      onCancelEvent(event.eventId);
      navigate(afterSave.eventsPath, { state: { message: createEventMessages.cancelled } });
      return;
    }
    onDeleteEvent(event.eventId);
    navigate(event.status === "draft" ? afterSave.draftsPath : afterSave.eventsPath, {
      state: { message: createEventMessages.deleted },
    });
  }

  function renderControl(field, sharedProps) {
    if (field.type === "textarea") {
      return (
        <textarea
          {...sharedProps}
          rows="5"
          maxLength={field.maxLength}
          placeholder={field.placeholder}
          value={form[field.id]}
          onChange={handleChange}
        />
      );
    }
    if (field.type === "category" || field.type === "area") {
      const options = field.type === "category" ? eventCategories : eventLocations;
      return (
        <select {...sharedProps} value={form[field.id]} onChange={handleChange}>
          <option value="">{field.placeholder}</option>
          {options.map(({ id, name }) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
      );
    }
    return (
      <input
        {...sharedProps}
        type={field.type}
        maxLength={field.maxLength}
        placeholder={field.placeholder}
        value={form[field.id]}
        onChange={handleChange}
      />
    );
  }

  function renderField(field) {
    if (field.type === "image") {
      return (
        <ImageDrop
          key={field.id}
          image={image}
          error={errors.image}
          inputRef={fileInputRef}
          onFile={handleImageFile}
          onRemove={handleImageRemove}
        />
      );
    }

    const errorId = `${field.id}-error`;
    const hintId = `${field.id}-hint`;
    const hasHint = Boolean(field.hint || field.maxLength);
    const sharedProps = {
      id: field.id,
      name: field.id,
      "aria-invalid": Boolean(errors[field.id]),
      "aria-describedby": [errors[field.id] && errorId, hasHint && hintId].filter(Boolean).join(" ") || undefined,
    };

    return (
      <div className="field event-field" key={field.id}>
        <label htmlFor={field.id}>
          {field.label}
          {field.optional && <span className="field-hint">Optional</span>}
        </label>
        {renderControl(field, sharedProps)}
        {hasHint && (
          <p className="field-hint event-field-hint" id={hintId}>
            <span>{field.hint}</span>
            {field.maxLength && (
              <span>
                {form[field.id].length}/{field.maxLength}
              </span>
            )}
          </p>
        )}
        {errors[field.id] && <FieldError id={errorId}>{errors[field.id]}</FieldError>}
      </div>
    );
  }

  // What the live card shows: the form so far, with stand-ins for blanks
  const category = eventCategories.find(({ id }) => id === form.categoryId);
  const area = eventLocations.find(({ id }) => id === form.locationId);
  const previewEvent = {
    eventId: event?.eventId ?? 0,
    name: form.eventName.trim() || "Your event's name",
    category: category?.name ?? "Category",
    location: area?.name ?? "Area",
    startDatetime: form.startDatetime,
    image: image || placeholder,
    imagePosition: image && image === event?.image ? event.imagePosition : undefined,
  };

  const checklistItems = submitChecklist.items.map((item) => ({
    ...item,
    done: item.fields.every((field) => form[field].trim()),
  }));
  const doneCount = checklistItems.filter((item) => item.done).length;

  const banner = event
    ? editBanners[event.status === "pending" && event.approvedSnapshot ? "pendingEdit" : event.status]
    : null;
  const danger = event ? dangerZone[hasBeenPublic(event) ? "cancel" : "delete"] : null;
  const summaryText = event
    ? `${editEventForm.summary[event.status] ?? event.status} · ${editEventForm.summary.lastEdited} ${editedFormatter.format(new Date(event.updatedAt))}`
    : createEventForm.summary;

  return (
    <div className="dashboard-page">
      <section
        className="dashboard-section"
        aria-labelledby="create-event-title"
      >
        <DashboardPageHeading
          id="create-event-title"
          icon={HeadingIcon}
          title={page.heading}
          summary={!lockedMessage && (!isEdit || event) ? summaryText : undefined}
        >
          {isEdit && (
            <Button type="button" variant="primary" size="sm" onClick={handleGoBack}>
              <goBack.icon aria-hidden="true" />
              {goBack.label}
            </Button>
          )}
        </DashboardPageHeading>

        {isEdit && !event ? (
          <EmptyState icon={HeadingIcon} text={createEventMessages.notFound} />
        ) : lockedMessage ? (
          <StatusMessage variant="error" className="table-message">
            {lockedMessage}
          </StatusMessage>
        ) : (
          <div className="event-form">
            {banner && (
              <div className={`callout event-details-banner status-${event.status}`} role="note">
                <banner.icon aria-hidden="true" />
                <p>
                  <strong>{banner.title}</strong>
                  {banner.text}
                  {event.status === "rejected" && event.rejectionReason && (
                    <span className="event-details-banner-reason">
                      {eventDetailsPage.rejectionReason} “{event.rejectionReason}”
                    </span>
                  )}
                </p>
              </div>
            )}
            {message && <StatusMessage ref={messageRef}>{message}</StatusMessage>}

            <div className="event-form-layout">
              <div className="event-form-main">
                <form id="event-form" className="panel event-form-panel" onSubmit={handleSubmit} noValidate>
                  {eventFormGroups.map((group, index) => (
                    <section className="event-form-group" aria-labelledby={`group-${group.id}`} key={group.id}>
                      <h2 className="event-form-group-title" id={`group-${group.id}`}>
                        {/* Numbered in the logo's cell, like the page title */}
                        <span className="event-form-step" aria-hidden="true">
                          <span>{index + 1}</span>
                        </span>
                        {group.title}
                      </h2>
                      <div className={group.row ? "event-form-row" : "event-form-fields"}>
                        {group.fields.map(renderField)}
                      </div>
                    </section>
                  ))}
                </form>

                {/* Edit only: Cancel for an event that has been public, Delete
                    for one that never was; asked here, like Settings */}
                {danger && (
                  <section className="event-danger-zone" aria-labelledby="danger-title">
                    <div>
                      <h2 className="event-danger-zone-title" id="danger-title">
                        <danger.icon aria-hidden="true" />
                        {danger.title}
                      </h2>
                      <p className="event-danger-zone-text">
                        {confirming ? danger.question : danger.text}
                      </p>
                    </div>
                    <div className="event-danger-zone-actions">
                      {confirming ? (
                        <>
                          <Button type="button" variant="secondary" size="md" onClick={() => setConfirming(false)}>
                            {danger.keep}
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="md"
                            onClick={() => handleDangerConfirm(hasBeenPublic(event) ? "cancel" : "delete")}
                          >
                            <danger.icon aria-hidden="true" />
                            {danger.confirm}
                          </Button>
                        </>
                      ) : (
                        <Button type="button" variant="danger" size="md" onClick={() => setConfirming(true)}>
                          <danger.icon aria-hidden="true" />
                          {danger.button}
                        </Button>
                      )}
                    </div>
                  </section>
                )}
              </div>

              <aside className="event-form-side" aria-label="Preview and save">
                <p className="group-label event-form-side-label">{createEventForm.previewLabel}</p>
                {/* A picture of the result; the form is what screen readers use */}
                <div className="event-form-preview" aria-hidden="true">
                  <EventCard event={previewEvent} preview />
                </div>

                <div className="panel event-form-actions">
                  {isDraft && (
                    <div className="event-form-checklist">
                      <p className="event-form-checklist-title">
                        {submitChecklist.title(doneCount, checklistItems.length)}
                      </p>
                      <ul>
                        {checklistItems.map((item) => (
                          <li className={item.done ? "is-done" : ""} key={item.label}>
                            {item.done ? <CircleCheck aria-hidden="true" /> : <Circle aria-hidden="true" />}
                            {item.label}
                            <span className="sr-only">{item.done ? ", done" : ", still needed"}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {isDraft ? (
                    <>
                      <Button type="submit" form="event-form" name="saveDraft" variant="secondary" size="md">
                        <saveDraft.icon aria-hidden="true" />
                        {saveDraft.label}
                      </Button>
                      <Button type="submit" form="event-form" name="submit" variant="primary" size="md">
                        <submit.icon aria-hidden="true" />
                        {submit.label}
                      </Button>
                    </>
                  ) : (
                    <Button type="submit" form="event-form" name="resubmit" variant="primary" size="md">
                      <resubmit.icon aria-hidden="true" />
                      {resubmit.label}
                    </Button>
                  )}
                  <p className="event-form-actions-note">
                    {isDraft ? createEventForm.draftNote : editEventForm.resubmitNote}
                  </p>
                </div>
              </aside>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
