import { useState } from "react";
import Button from "../UI/Button";
import FieldError from "../UI/FieldError";
import { allowedImageTypes, imageDrop } from "../../data/createEventsData";

// The photo box: drop or click to choose; once chosen the photo fills it,
// with Replace and Remove. The file goes with Save or Submit (Phase 6)
export default function ImageDrop({ image, error, inputRef, onFile, onRemove }) {
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
