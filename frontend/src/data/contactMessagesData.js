import { Bell, Logs, MessageSquareText } from "lucide-react";

export const contactMessagesActions = [
  { label: "System Logs", to: "/dashboard/system-logs", icon: Logs },
  { label: "Notifications", to: "/dashboard/notifications", icon: Bell },
];

export const contactMessagesPage = {
  title: "Contact Messages",
  icon: MessageSquareText,
};

// The line under the page title: "3 messages · 2 unread · newest 26 Sept"
export const contactMessagesSummary = {
  message: "message",
  messages: "messages",
  unread: "unread",
  newest: "newest",
  none: "No messages yet",
};

// Messages from contact_messages_view and contact_view PHP files
export const contactMessagesText = {
  noMessages: "No contact messages yet.",
  userIdBadge: "User ID",
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
  },
  {
    messageId: 3,
    userId: 14,
    name: "samk",
    email: "sam.k@email.com",
    message: "The map on Live at MediaCity shows the wrong entrance. It should be the Plaza side.",
    sentAt: "2026-09-19T08:52:00",
    readAt: "2026-09-19T10:30:00",
  },
];
