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
  repliedOn: (date) => `You replied on ${date}`,
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

// Mock of the contact_messages table (held in App state so the public
// Contact form can add to it)
export const initialContactMessages = [
  {
    messageId: 1,
    userId: 7,
    name: "userName",
    email: "user@email.com",
    message:
      "Hi, is there a way to get reminders for events in my favourite categories by email as well?\nThanks!",
    sentAt: "2026-09-26T19:40:00",
    readAt: null,
    repliedAt: null,
    repliedBy: null,
    replyBody: null,
  },
  {
    messageId: 2,
    userId: null,
    name: "Priya Shah",
    email: "priya.shah@email.com",
    message:
      "I run a small community choir in Levenshulme. Can we list free concerts on the portal, and how do we become an organiser?",
    sentAt: "2026-09-24T11:05:00",
    readAt: null,
    repliedAt: null,
    repliedBy: null,
    replyBody: null,
  },
  {
    messageId: 3,
    userId: 14,
    name: "samk",
    email: "sam.k@email.com",
    message: "The map on Live at MediaCity shows the wrong entrance. It should be the Plaza side.",
    sentAt: "2026-09-19T08:52:00",
    readAt: "2026-09-19T10:30:00",
    repliedAt: "2026-09-19T10:41:00",
    repliedBy: 1,
    replyBody: "Thanks Sam, well spotted. We've asked the organiser to fix the entrance on the map.",
  },
];
