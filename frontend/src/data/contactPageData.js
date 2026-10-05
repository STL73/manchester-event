import {
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Send,
} from "lucide-react";

import mediacity2 from "../images/mediacity2.jpg";
import { socialLinks } from "./socialLinks";

export const contactPageData = {
  title: "Contact Us",
  image: {
    src: mediacity2,
    alt: "Manchester MediaCity",
  },
  intro:
    "We would love to hear from you! Whether you have questions, feedback, or suggestions, feel free to reach out to us through any of the following methods:",
  form: {
    title: "Contact Form",
    description: "Send your message",
    fields: [
      { id: "name", label: "Name", type: "text", placeholder: "Enter Your Name" },
      { id: "email", label: "Email", type: "email", placeholder: "Enter Your Email" },
      { id: "message", label: "Message", type: "textarea", placeholder: "Enter Your Message" },
    ],
  },
  contactDetails: [
    {
      label: "Email",
      value: "manchestereventportal@gmail.com",
      icon: Mail,
      href: "mailto:manchestereventportal@gmail.com",
    },
    { label: "Phone", value: "01234567890", icon: Phone },
    { label: "Address", value: "123 Main Street, Manchester, UK", icon: MapPin },
  ],
  socialLinks,
  responseNote:
    "We aim to respond to all inquiries within 24-48 hours. Thank you for your interest in Manchester Event Portal!",
  actions: {
    submit: { label: "Send Message", icon: Send },
    reset: { label: "Reset", icon: RefreshCw },
  },
};
