import { AnimatedLoader } from "@/components/ui/animated-loader";
import { useState } from "react";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { productRequest } from "@/lib/explorer";
import { useAction, useProduct, type ProductSession } from "./context";
import { ActionError, ExploreLink, Field } from "./ui";
export function LoginPage({ onSuccess }: { onSuccess?: () => void } = {}) {
  const app = useProduct();
  const action = useAction();
  const [create, setCreate] = useState(false);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [sent, setSent] = useState("");
  const [consent, setConsent] = useState(false);
  const [resendAt, setResendAt] = useState(0);
  async function send() {
    if (!/^\d{10}$/.test(phone)) throw new Error("Enter a valid 10-digit mobile number.");
    if (create && (name.trim().length < 2 || !consent))
      throw new Error("Enter your name and accept the terms to create an account.");
    const result = await productRequest<{ sessionId: string; message: string }>(
      "/auth/send-otp",
      null,
      "POST",
      { phone, create },
    );
    setSessionId(result.sessionId);
    setSent(result.message);
    setResendAt(Date.now() + 30000);
  }
  return (
    <div className="xp-auth-layout">
      <ExploreLink view="home" className="xp-auth-skip">
        Skip
      </ExploreLink>
      <div className="xp-auth-art">
        <img src="/images/hero-keys.jpg" alt="A couple holding the keys to their home" />
        <div>
          <span>YOUR NEXT CHAPTER</span>
          <h2>
            People. Places.
            <br />
            Possibilities.
          </h2>
          <p>One account for your entire property journey.</p>
        </div>
      </div>
      <section className="xp-auth-card">
        <ShieldCheck className="xp-auth-symbol" size={34} />
        <span className="xp-kicker">WELCOME TO PROPERTYSETU</span>
        <h1>
          {sessionId
            ? "Check your phone"
            : create
              ? "Make yourself at home"
              : "Good to see you again"}
        </h1>
        <p>
          {sessionId
            ? `Enter the verification code for +91 ${phone}.`
            : "Save the places you love and connect directly with owners."}
        </p>
        {!sessionId && (
          <div className="xp-auth-tabs" role="group" aria-label="Account access">
            {[false, true].map((signup) => (
              <button
                type="button"
                key={String(signup)}
                aria-pressed={create === signup}
                onClick={() => {
                  setCreate(signup);
                  action.setError("");
                }}
              >
                {signup ? "Sign up" : "Login"}
              </button>
            ))}
          </div>
        )}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void action.run(async () => {
              if (!sessionId) {
                await send();
                return;
              }
              const result = await productRequest<ProductSession>(
                "/auth/verify-otp",
                null,
                "POST",
                { phone, otp, sessionId, create, ...(create ? { full_name: name } : {}) },
              );
              app.signIn(result);
              if (onSuccess) {
                onSuccess();
                return;
              }
              app.go(
                app.location.next && app.location.next !== "login" ? app.location.next : "profile",
                app.location.id,
              );
            });
          }}
        >
          {!sessionId ? (
            <>
              {create && (
                <Field label="Your full name">
                  <input
                    autoComplete="name"
                    required
                    minLength={2}
                    maxLength={80}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </Field>
              )}
              <Field label="Mobile number" hint="Indian mobile number, without +91">
                <div className="xp-phone-input">
                  <span>+91</span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    pattern="[0-9]{10}"
                    maxLength={14}
                    required
                    value={phone}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "");
                      setPhone(
                        digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits,
                      );
                    }}
                    placeholder="10-digit mobile number"
                  />
                </div>
              </Field>
              {create && (
                <label className="xp-check">
                  <input
                    type="checkbox"
                    required
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                  />
                  <span>
                    I agree to the{" "}
                    <Link to="/terms" target="_blank">
                      terms and community rules
                    </Link>{" "}
                    and{" "}
                    <Link to="/privacy" target="_blank">
                      privacy policy
                    </Link>
                    .
                  </span>
                </label>
              )}
            </>
          ) : (
            <>
              <Field label="Verification code">
                <input
                  autoFocus
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{4,8}"
                  minLength={4}
                  maxLength={8}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                />
              </Field>
              <p className="xp-help" role="status">
                {sent}
              </p>
            </>
          )}
          <ActionError error={action.error} />
          <button className="xp-button full" disabled={action.busy}>
            {action.busy ? (
              <>
                <AnimatedLoader size="small" color="currentColor" />
                Please wait…
              </>
            ) : sessionId ? (
              "Verify and continue"
            ) : (
              "Send verification code"
            )}
            <ArrowRight size={17} />
          </button>
        </form>
        {sessionId ? (
          <div className="xp-auth-links">
            <button
              onClick={() => {
                setSessionId("");
                setOtp("");
                action.setError("");
              }}
              disabled={action.busy}
            >
              <ArrowLeft size={14} />
              Change number
            </button>
            <button
              disabled={action.busy}
              onClick={() =>
                void action.run(async () => {
                  if (Date.now() < resendAt)
                    throw new Error("Please wait 30 seconds before requesting another code.");
                  await send();
                })
              }
            >
              Resend code
            </button>
          </div>
        ) : (
          <p className="xp-auth-switch">
            {create ? "Already have an account?" : "New to PropertySetu?"}{" "}
            <button
              onClick={() => {
                setCreate(!create);
                action.setError("");
              }}
            >
              {create ? "Sign in" : "Create account"}
            </button>
          </p>
        )}
      </section>
    </div>
  );
}
