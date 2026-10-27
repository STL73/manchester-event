import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { LoaderCircle } from "lucide-react";
import Button from "../components/UI/Button";
import { api } from "../lib/api";
import { verifyEmailPage } from "../data/authPageData";

// Opened from the link in the verification email. The page sends the token
// with a POST: email scanners open every GET link, and would use it up first
export default function VerifyEmail({ isUser, onVerified }) {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  // checking, done, or failed
  const [state, setState] = useState(token ? "checking" : "failed");
  const [message, setMessage] = useState("");
  // StrictMode runs effects twice in development, and the link works once
  const sent = useRef(false);

  useEffect(() => {
    if (!token || sent.current) return;
    sent.current = true;
    api("/auth/verify-email", { method: "POST", body: { token } })
      .then(() => {
        setState("done");
        onVerified();
      })
      .catch((error) => {
        setMessage(error.message);
        setState("failed");
      });
  }, [token, onVerified]);

  const result = state === "checking" ? null : verifyEmailPage[state];
  const Icon = result?.icon ?? LoaderCircle;

  return (
    <section className="section-content auth-section">
      <div className="honeycomb-texture auth-texture" aria-hidden="true" />
      <div
        className={`panel relative max-w-md flex flex-col items-start gap-4 ${result ? "" : "text-muted"}`}
        role="status"
      >
        <Icon
          className={`size-8 ${state === "done" ? "text-success" : state === "failed" ? "text-danger" : "animate-spin motion-reduce:animate-none"}`}
          aria-hidden="true"
        />
        {result ? (
          <>
            <h1 className="heading-panel">{result.title}</h1>
            <p className="text-muted">
              {state === "failed" && message
                ? `${message} ${isUser ? verifyEmailPage.nextStep.signedIn : verifyEmailPage.nextStep.signedOut}`
                : result.text}
            </p>
            <Button to={isUser ? "/dashboard/home" : "/auth/login"}>
              {isUser ? verifyEmailPage.toDashboard : verifyEmailPage.toLogin}
            </Button>
          </>
        ) : (
          <p>{verifyEmailPage.checking}</p>
        )}
      </div>
    </section>
  );
}
