// Text people typed (names, messages, event names) going into an email's HTML
export function escapeHtml(value) {
    return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}
