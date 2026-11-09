import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { CircleCheck, Circle } from "lucide-react";
import Button from "../components/UI/Button";
import FieldError from "../components/UI/FieldError";
import StatusMessage from "../components/UI/StatusMessage";
import EventCard from "../components/events/EventCard";
import DashboardPageHeading from "../components/dashboard/DashboardPageHeading";
import EmptyState from "../components/UI/EmptyState";
import PageLoading from "../components/UI/PageLoading";
import VenueSearch from "../components/events/VenueSearch";
import ImageDrop from "../components/events/ImageDrop";
import { eventCategories, eventDetailsPage } from "../data/eventsData";
import { eventState } from "../lib/eventStatus";
import {
  afterSave,
  allowedImageTypes,
  createEventForm,
  createEventMessages,
  dangerZone,
  editBanners,
  editEventForm,
  eventFormGroups,
  maxImageSize,
  submitChecklist,
} from "../data/createEventsData";
import { bodyFromForm, emptyForm, errorsFromServer, formFromEvent, validateEvent } from "../lib/eventForm";
import { toLondonInput } from "../lib/organiserEvents";
import { defaultEventImage as placeholder } from "../lib/publicEvents";
import { formatDayMonth } from "../lib/formatDates";

// Create Event, and Edit Event on /dashboard/my-events/:eventId/edit. A new key
// per event resets the form when moving between edit pages
export default function CreateEvents(props) {
  const { eventId } = useParams();
  return <EventFormPage key={eventId ?? "new"} {...props} />;
}

// Waits for the organiser's events before an edit form can open
function EventFormPage({
  mode = "create",
  events = [],
  onCreateEvent,
  onUpdateEvent,
  onCancelEvent,
  onDeleteEvent,
}) {
  const isEdit = mode === "edit";
  // The organiser's events arrive from the API; until then there is nothing to edit
  if (isEdit && events === null) return <PageLoading />;
  return (
    <EventForm
      {...{ isEdit, onCreateEvent, onUpdateEvent, onCancelEvent, onDeleteEvent }}
      events={events ?? []}
    />
  );
}

// The form, the live card beside it and its buttons
function EventForm({ isEdit, events, onCreateEvent, onUpdateEvent, onCancelEvent, onDeleteEvent }) {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  // Only the organiser's own events can be edited
  const event = isEdit
    ? events.find((item) => String(item.eventId) === eventId)
    : null;

  const [form, setForm] = useState(() => (event ? formFromEvent(event) : emptyForm));
  // The venue picked: its name, address and area show under the field
  const [venue, setVenue] = useState(() => event?.venue ?? null);
  // The event's own photo; the default one counts as none
  const savedImage = event?.image && event.image !== placeholder ? event.image : "";
  // The photo shown: the event's own, a new pick (an object URL) or none
  const [image, setImage] = useState(savedImage);
  // The picked file, sent with Save or Submit
  const [imageFile, setImageFile] = useState(null);
  const [errors, setErrors] = useState({});
  // { text, variant }: a save that worked, or the server's reason it didn't
  const [message, setMessage] = useState(null);
  // A save is on its way: the buttons wait, so it can't be sent twice
  const [saving, setSaving] = useState(false);
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
  // Past isn't stored: an approved event whose dates have gone by is past
  const lockedMessage =
    event && eventState(event, new Date()) === "past"
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
    setMessage(null);
  }

  function handleVenue(place) {
    setVenue(place);
    setForm((current) => ({ ...current, placeId: place?.placeId ?? "" }));
    setErrors((current) => ({ ...current, placeId: undefined }));
    setMessage(null);
    // Change empties the field: the search box takes the focus back
    if (!place) requestAnimationFrame(() => document.getElementById("placeId")?.focus());
  }

  // The photo's type and size, checked before it is kept
  function handleImageFile(file) {
    setMessage(null);
    const imageError = !allowedImageTypes.includes(file.type)
      ? createEventMessages.invalidImage
      : file.size > maxImageSize
        ? createEventMessages.imageTooLarge
        : "";

    setErrors((current) => ({ ...current, image: imageError || undefined }));
    if (imageError) return;
    if (image.startsWith("blob:")) URL.revokeObjectURL(image);
    setImage(URL.createObjectURL(file));
    setImageFile(file);
  }

  function handleImageRemove() {
    if (image.startsWith("blob:")) URL.revokeObjectURL(image);
    setImage("");
    setImageFile(null);
    setErrors((current) => ({ ...current, image: undefined }));
    requestAnimationFrame(() => fileInputRef.current?.focus());
  }

  async function handleSubmit(submitEvent) {
    submitEvent.preventDefault();
    if (saving) return;
    // The button pressed decides: Save draft keeps a draft; anything else is
    // sent for approval
    const submit = submitEvent.nativeEvent.submitter?.name !== "saveDraft";
    const nextErrors = validateEvent(form, {
      submitting: submit,
      originalStart: event && event.status !== "draft" ? toLondonInput(event.startDatetime) : "",
    });

    setErrors(nextErrors);
    setMessage(null);
    const firstInvalid = Object.keys(nextErrors)[0];
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus();
      return;
    }

    setSaving(true);
    // Removing the event's own photo goes back to the default one
    const body = { ...bodyFromForm(form, submit), ...(savedImage && !image && { removeImage: true }) };
    let saved;
    try {
      saved = isEdit
        ? await onUpdateEvent(event.eventId, body, imageFile)
        : await onCreateEvent(body, imageFile);
    } catch (error) {
      // Under its field when the server names one, otherwise over the form
      const refused = errorsFromServer(error);
      setErrors(refused);
      // The first in the form's order, not the server's; the photo comes last
      const firstField = [...Object.keys(emptyForm), "image"].find((field) => refused[field]);
      if (firstField) document.getElementById(firstField)?.focus();
      else setMessage({ text: error.message, variant: "error" });
      setSaving(false);
      return;
    }
    setSaving(false);
    // The stored photo replaces the preview, so the next Save doesn't send it again
    if (image.startsWith("blob:")) URL.revokeObjectURL(image);
    setImage(saved.image !== placeholder ? saved.image : "");
    setImageFile(null);

    if (saved.status === "draft") {
      if (isEdit) {
        setMessage({ text: createEventMessages.draftSaved });
        return;
      }
      navigate(afterSave.draftsPath, { state: { message: createEventMessages.createdDraft } });
      return;
    }
    navigate(afterSave.pendingPath, {
      state: { message: isEdit && !isDraft ? createEventMessages.resubmitted : createEventMessages.submitted },
    });
  }

  // Cancel or Delete, asked in the page
  async function handleDangerConfirm(kind) {
    if (saving) return;
    setSaving(true);
    try {
      if (kind === "cancel") await onCancelEvent(event.eventId);
      else await onDeleteEvent(event.eventId);
    } catch (error) {
      setSaving(false);
      setConfirming(false);
      setMessage({ text: error.message, variant: "error" });
      return;
    }
    if (kind === "cancel") {
      navigate(afterSave.eventsPath, { state: { message: createEventMessages.cancelled } });
      return;
    }
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
    if (field.type === "venue") {
      return (
        <VenueSearch
          id={field.id}
          venue={venue}
          placeholder={field.placeholder}
          invalid={sharedProps["aria-invalid"]}
          describedBy={sharedProps["aria-describedby"]}
          onChange={handleVenue}
        />
      );
    }
    if (field.type === "category") {
      return (
        <select {...sharedProps} value={form[field.id]} onChange={handleChange}>
          <option value="">{field.placeholder}</option>
          {eventCategories.map(({ id, name }) => (
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

  // Its own renderer rather than FormField: numbered groups, character
  // counters, VenueSearch and the photo box
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
  const previewEvent = {
    eventId: event?.eventId ?? 0,
    name: form.eventName.trim() || "Your event's name",
    category: category?.name ?? "Category",
    location: venue?.name ?? "Venue",
    startDatetime: form.startDatetime,
    image: image || placeholder,
  };

  const checklistItems = submitChecklist.items.map((item) => ({
    ...item,
    done: item.fields.every((field) => form[field].trim()),
  }));
  const doneCount = checklistItems.filter((item) => item.done).length;

  const banner = event
    ? editBanners[event.status === "pending" && event.editPending ? "pendingEdit" : event.status]
    : null;
  const danger = event ? dangerZone[event.hasBeenPublic ? "cancel" : "delete"] : null;
  const summaryText = event
    ? `${editEventForm.summary[event.status] ?? event.status} · ${editEventForm.summary.lastEdited} ${formatDayMonth(event.updatedAt)}`
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
          <div className="w-full flex flex-col gap-5">
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
            {message && (
              <StatusMessage ref={messageRef} variant={message.variant}>
                {message.text}
              </StatusMessage>
            )}

            <div className="event-form-layout">
              <div className="min-w-0 flex flex-col gap-7">
                <form id="event-form" className="panel event-form-panel" onSubmit={handleSubmit} noValidate>
                  {eventFormGroups.map((group, index) => (
                    <section className="event-form-group" aria-labelledby={`group-${group.id}`} key={group.id}>
                      <h2 className="event-form-group-title" id={`group-${group.id}`}>
                        {/* Numbered in the logo's cell, like the page title */}
                        <span className="hex-frame event-form-step" aria-hidden="true">
                          <span>{index + 1}</span>
                        </span>
                        {group.title}
                      </h2>
                      <div className={group.row ? "event-form-row" : "flex flex-col gap-4"}>
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
                    <div className="flex flex-wrap gap-2.5">
                      {confirming ? (
                        <>
                          <Button type="button" variant="secondary" size="md" onClick={() => setConfirming(false)}>
                            {danger.keep}
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="md"
                            disabled={saving}
                            onClick={() => handleDangerConfirm(event.hasBeenPublic ? "cancel" : "delete")}
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
                      <Button type="submit" form="event-form" name="saveDraft" disabled={saving} variant="secondary" size="md">
                        <saveDraft.icon aria-hidden="true" />
                        {saveDraft.label}
                      </Button>
                      <Button type="submit" form="event-form" name="submit" disabled={saving} variant="primary" size="md">
                        <submit.icon aria-hidden="true" />
                        {submit.label}
                      </Button>
                    </>
                  ) : (
                    <Button type="submit" form="event-form" name="resubmit" disabled={saving} variant="primary" size="md">
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
