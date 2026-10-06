import { LogIn, UserPlus } from "lucide-react";

import mediacityGlobeNight from "../images/events/mediacity-globe-night.jpg";
import salfordQuaysDusk from "../images/events/salford-quays-dusk.jpg";

// The backend applies the same rule; the check here only gives quick feedback
export const PASSWORD_MIN_LENGTH = 8;

// Admin is never offered: admins come from the seed script, not sign-up
export const signUpRoles = ["user", "organiser"];

// Keyed by the :pathname in /auth/:pathname
export const authPageData = {
  login: {
    title: "Welcome back",
    subtitle: "Log in to your Manchester Event Portal account",
    image: { src: mediacityGlobeNight, alt: "MediaCityUK lit up at night" },
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
    // Shown on a valid submit until the backend handlers exist
    success: "Your details look right. Logging in will work once the backend is connected.",
  },
  "sign-up": {
    title: "Create your account",
    subtitle: "Discover events across Greater Manchester, or promote your own",
    image: { src: salfordQuaysDusk, alt: "Salford Quays at dusk" },
    // Hints sit on the label row, so they stay short. maxLength already
    // enforces the display name limit, and the verification email is
    // explained in the success message instead
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
    success:
      "Your details look right. Once the backend is connected, we'll email you a link to verify your address.",
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
