import { Mail } from "lucide-react";

import concert2 from "../images/concert2.jpg";
import mediacity3 from "../images/mediacity3.jpg";
import { socialLinks } from "./socialLinks";

export const aboutPageData = {
  title: "About Us",
  introImage: {
    src: mediacity3,
    alt: "Manchester MediaCity",
  },
  outroImage: {
    src: concert2,
    alt: "People enjoying a concert",
  },
  paragraphs: [
    "Manchester Event Portal is a platform that connects local businesses, event organisers, and attendees. We help you find events, create your own events, and connect with your community.",
    "Our mission is to make it easy for everyone to discover and participate in events that matter to them. Whether you are looking for cultural events, professional networking opportunities, or just a fun night out, we have got you covered.",
    "We believe in the power of community and strive to create a platform that fosters connections and engagement. Join us in making Manchester a vibrant place to live, work, and play.",
    "If you have any questions or suggestions, feel free to reach out to us through our contact page. We would love to hear from you!",
  ],
  contact: {
    label: "Contact Us",
    to: "/contact",
    icon: Mail,
  },
  socialLinks,
};
