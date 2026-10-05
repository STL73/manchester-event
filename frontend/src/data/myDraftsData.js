import { CalendarCheck, CalendarPlus } from "lucide-react";

export const myDraftsActions = [
  { label: "Create Events", to: "/dashboard/create-events", icon: CalendarPlus },
  { label: "My Events", to: "/dashboard/my-events", icon: CalendarCheck },
];

export const draftTableColumns = [
  "Title",
  "Category",
  "Created",
  "Updated",
  "Actions",
];

// Tooltips for the table's icon buttons, in button order
export const draftTooltips = {
  edit: "Edit draft",
  submit: "Submit draft for approval",
  delete: "Delete draft",
};

// Messages from my_drafts_view.inc.php, plus the new draft delete
export const myDraftsMessages = {
  noDrafts: "No draft events found.",
  confirmDelete: "Are you sure you want to delete this draft?",
  draftDeleted: "Draft deleted successfully!",
};
