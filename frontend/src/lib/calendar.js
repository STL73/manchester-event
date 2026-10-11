// "Add to calendar": an iCalendar (.ics) file for one event, which Google,
// Apple and Outlook calendars all open. Built in the browser, no backend.

// Event times are Manchester wall-clock times ("2026-10-18T19:30:00"), so
// they go out as Europe/London local times rather than being converted
// through the visitor's own time zone. The VTIMEZONE block carries the UK
// clock-change rules for calendars that don't know the zone by name
const LONDON_TIMEZONE = [
  "BEGIN:VTIMEZONE",
  "TZID:Europe/London",
  "BEGIN:DAYLIGHT",
  "TZOFFSETFROM:+0000",
  "TZOFFSETTO:+0100",
  "TZNAME:BST",
  "DTSTART:19700329T010000",
  "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU",
  "END:DAYLIGHT",
  "BEGIN:STANDARD",
  "TZOFFSETFROM:+0100",
  "TZOFFSETTO:+0000",
  "TZNAME:GMT",
  "DTSTART:19701025T020000",
  "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU",
  "END:STANDARD",
  "END:VTIMEZONE",
];

// "2026-10-18T19:30:00" -> "20261018T193000"
function localTime(datetime) {
  return datetime.slice(0, 19).replace(/[-:]/g, "");
}

// RFC 5545 text: backslash, semicolon, comma and line breaks are escaped
function escapeText(text) {
  return String(text)
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

// Lines longer than 75 characters continue on the next line after a space
function fold(line) {
  const parts = [];
  for (let start = 0; start < line.length; start += 73) {
    parts.push((start === 0 ? "" : " ") + line.slice(start, start + 73));
  }
  return parts.join("\r\n");
}

// `pageUrl` is the event's public page, so the calendar entry links back.
// An event without an end time gets no DTEND: calendars then show it at its
// start time, rather than with a length the organiser never gave
export function buildEventIcs(event, pageUrl) {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const place = [event.location, event.address].filter(Boolean).join(", ");
  const description = [event.description, pageUrl].filter(Boolean).join("\n\n");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Manchester Event Portal//Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...LONDON_TIMEZONE,
    "BEGIN:VEVENT",
    `UID:event-${event.eventId}@manchester-event-portal`,
    `DTSTAMP:${stamp}`,
    `DTSTART;TZID=Europe/London:${localTime(event.startDatetime)}`,
    event.endDatetime && `DTEND;TZID=Europe/London:${localTime(event.endDatetime)}`,
    `SUMMARY:${escapeText(event.name)}`,
    place && `LOCATION:${escapeText(place)}`,
    description && `DESCRIPTION:${escapeText(description)}`,
    pageUrl && `URL:${pageUrl}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.filter(Boolean).map(fold).join("\r\n") + "\r\n";
}

// "Manchester Live Sessions" -> "manchester-live-sessions.ics"
function fileName(event) {
  const slug = event.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${slug || `event-${event.eventId}`}.ics`;
}

// Hands the file to the browser as a download; the calendar app takes it
// from there when the visitor opens it
export function downloadEventIcs(event, pageUrl) {
  const blob = new Blob([buildEventIcs(event, pageUrl)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName(event);
  document.body.append(link);
  link.click();
  link.remove();
  // Freed a moment later: some browsers start the download after click returns
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
