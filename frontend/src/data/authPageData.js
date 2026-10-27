import { LogIn, MailCheck, MailX, UserPlus } from "lucide-react";

// Resized copies for this page; the events keep their own full-size files
import mediacityWaterfrontNight from "../images/site/mediacity-waterfront-night.webp";
import oldTraffordNight from "../images/site/old-trafford-night.webp";

// The backend applies the same rule; the check here only gives quick feedback
export const PASSWORD_MIN_LENGTH = 8;

// Admin is never offered: admins come from the seed script, not sign-up
export const signUpRoles = ["user", "organiser"];

// Keyed by the :pathname in /auth/:pathname
export const authPageData = {
  login: {
    title: "Welcome back",
    subtitle: "Log in to your Manchester Event Portal account",
    image: { src: oldTraffordNight, alt: "Old Trafford lit up at night across the water" },
    // Over the photo, so only seen from md up (the photo is hidden below)
    caption: {
      place: "Old Trafford",
      text: "Gigs, markets and match days across Greater Manchester",
    },
    // Each row is one field, or an array of fields shown side by side
    fields: [
      {
        id: "email",
        label: "Email",
        type: "email",
        placeholder: "name@example.com",
        autoComplete: "email",
      },
      {
        id: "password",
        label: "Password",
        type: "password",
        autoComplete: "current-password",
      },
    ],
    submit: { label: "Log In", icon: LogIn },
    switchPrompt: { text: "Don't have an account?", label: "Sign Up", to: "/auth/sign-up" },
    endpoint: "/auth/login",
  },
  "sign-up": {
    title: "Create your account",
    subtitle: "Discover events across Greater Manchester, or promote your own",
    image: { src: mediacityWaterfrontNight, alt: "Salford Quays and the Millennium Bridge at night" },
    caption: {
      place: "Salford Quays",
      text: "See what's on tonight, save the events you love, or list your own",
    },
    // Hints sit on the label row, so they stay short. maxLength already
    // enforces the display name limit, and the verification email is
    // explained by the banner on the dashboard, where sign-up lands
    fields: [
      [
        {
          id: "username",
          label: "Display name",
          placeholder: "Your name",
          autoComplete: "nickname",
          maxLength: 50,
        },
        {
          id: "email",
          label: "Email",
          type: "email",
          placeholder: "name@example.com",
          autoComplete: "email",
        },
      ],
      [
        {
          id: "password",
          label: "Password",
          type: "password",
          autoComplete: "new-password",
          hint: `${PASSWORD_MIN_LENGTH}+ characters`,
        },
        {
          id: "confirmPassword",
          label: "Confirm password",
          type: "password",
          autoComplete: "new-password",
        },
      ],
      {
        id: "role",
        label: "Account type",
        type: "radio",
        options: [
          // Short enough to stay on one line in a half-width card
          { value: "user", label: "User", description: "Find and save events" },
          { value: "organiser", label: "Organiser", description: "Host and promote events" },
        ],
      },
    ],
    submit: { label: "Create Account", icon: UserPlus },
    switchPrompt: { text: "Already have an account?", label: "Log In", to: "/auth/login" },
    endpoint: "/auth/sign-up",
  },
};

export const authErrors = {
  usernameRequired: "Enter a display name.",
  emailRequired: "Enter your email address.",
  emailInvalid: "Enter an email address like name@example.com.",
  passwordRequired: "Enter your password.",
  // The field's hint already states the rule, so the error doesn't repeat it
  passwordTooShort: "This password is too short.",
  passwordsDiffer: "The passwords don't match.",
  roleRequired: "Choose an account type.",
};

// /auth/verify-email, opened from the link in the verification email
export const verifyEmailPage = {
  checking: "Checking your link…",
  done: {
    icon: MailCheck,
    title: "Email confirmed",
    text: "Thanks. Your email address is verified.",
  },
  failed: {
    icon: MailX,
    title: "This link didn't work",
    // The server's message says why (expired or already used); this is for a link with no token
    text: "This link is incomplete. Open the newest email we sent, or send a new link from your dashboard.",
  },
  // After the reason the link failed
  nextStep: {
    signedIn: "You can send a new link from your dashboard.",
    signedOut: "Log in to send a new link.",
  },
  toDashboard: "Go to your dashboard",
  toLogin: "Log In",
};
