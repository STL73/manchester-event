import { KeyRound, LogIn, MailCheck, MailX, Send, UserPlus } from "lucide-react";

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
    // On the password's label row, where the hint would go
    forgotLink: { label: "Forgot password?", to: "/auth/forgot-password" },
    submit: { label: "Log In", icon: LogIn },
    switchPrompt: { text: "Don't have an account?", label: "Sign Up", to: "/auth/sign-up" },
    endpoint: "/auth/login",
    onSuccess: "signedIn",
  },
  "forgot-password": {
    title: "Forgot your password?",
    subtitle: "Enter your account's email and we'll send you a link to choose a new one",
    image: { src: oldTraffordNight, alt: "Old Trafford lit up at night across the water" },
    caption: {
      place: "Old Trafford",
      text: "Gigs, markets and match days across Greater Manchester",
    },
    fields: [
      {
        id: "email",
        label: "Email",
        type: "email",
        placeholder: "name@example.com",
        autoComplete: "email",
      },
    ],
    submit: { label: "Send Link", icon: Send },
    switchPrompt: { text: "Remembered it?", label: "Log In", to: "/auth/login" },
    endpoint: "/auth/forgot-password",
    onSuccess: "sent",
    // The same words whether or not the email has an account (decided 2026-10-27)
    sent: (email) => [
      `If an account uses ${email}, we've sent it a link. The link works for 1 hour.`,
      "Nothing there? Check your spam folder, or send another.",
    ],
  },
  "reset-password": {
    title: "Choose a new password",
    subtitle: "Every device will be logged out, so you'll log in again with the new one",
    image: { src: mediacityWaterfrontNight, alt: "Salford Quays and the Millennium Bridge at night" },
    caption: {
      place: "Salford Quays",
      text: "See what's on tonight, save the events you love, or list your own",
    },
    fields: [
      {
        id: "password",
        label: "New password",
        type: "password",
        autoComplete: "new-password",
        hint: `${PASSWORD_MIN_LENGTH}+ characters`,
      },
      {
        id: "confirmPassword",
        label: "Confirm new password",
        type: "password",
        autoComplete: "new-password",
      },
    ],
    submit: { label: "Save Password", icon: KeyRound },
    switchPrompt: { text: "Link expired?", label: "Send another", to: "/auth/forgot-password" },
    endpoint: "/auth/reset-password",
    // The link's token goes with the form
    needsToken: true,
    missingToken: "This link is incomplete. Open the newest email we sent, or send another link.",
    onSuccess: "reset",
    // Shown on Log in, where the reset leads
    done: "Your password has been changed. Log in with the new one.",
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
    onSuccess: "signedIn",
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
