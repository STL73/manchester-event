import { Mail, MessageSquareText, Send } from "lucide-react";

// Contact Messages (decided 2026-10-12, layout A): the same list and side
// panel as Manage Events and Users. Opening a message reads it (read_at);
// the panel replies in the page (reply_body, replied_at, replied_by)
export const contactMessagesPage = {
  title: "Contact Messages",
  icon: MessageSquareText,
  searchPlaceholder: "Search names, emails or messages…",
  pageSize: 15,
  paging: (from, to, total) => `Showing ${from}–${to} of ${total} messages`,
  guest: "Guest",
  replied: "Replied",
  unreadLabel: "Unread",
};

// The line under the page title: "2 unread · newest 26 Sept · 1 replied"
export const contactMessagesSummary = {
  unread: "unread",
  allRead: "All read",
  newest: "newest",
  replied: "replied",
  none: "No messages yet",
};

export const messageViews = {
  label: "Show messages",
  options: [
    { value: "all", label: "All" },
    { value: "unread", label: "Unread", attention: true },
    { value: "replied", label: "Replied" },
    { value: "guests", label: "From guests" },
  ],
};

export const messageSortOptions = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
];

// The side panel
export const messagePanel = {
  title: "Message",
  guestNote: "Guest, no account",
  account: (role, joined) => `${role} · joined ${joined}`,
  sent: "Sent",
  replyLabel: (name) => `Reply to ${name}`,
  replyPlaceholder: (email) => `Write a reply. It's sent to ${email}.`,
  replyRequired: "Write a reply first.",
  // Another admin's name, or neither once their account is gone
  repliedOn: (date, mine, name) =>
    mine ? `You replied on ${date}` : name ? `${name} replied on ${date}` : `Replied on ${date}`,
  send: { label: "Send reply", icon: Send },
  markUnread: { label: "Mark as unread", icon: Mail },
};

// Messages from contact_messages_view and contact_view PHP files
export const contactMessagesText = {
  noMessages: "No contact messages yet.",
  noMatches: "No messages match.",
  clear: "Clear search and filters",
  replySent: "Reply sent.",
  markedUnread: "Marked as unread.",
  sent: "Your message has been sent successfully!",
  error: "There was an error sending your message. Please try again.",
};
