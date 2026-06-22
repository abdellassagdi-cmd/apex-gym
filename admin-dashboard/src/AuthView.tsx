import { useState } from "react";
import { ArrowRight, LockKeyhole, Mail, ShieldCheck, Sparkles } from "lucide-react";

import { supabase } from "./lib/supabase";

export function AuthView({
  onSignedIn,
  onSignedUp,
}: {
  onSignedIn: () => void;
  onSignedUp: (message: string) => void;
}) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("Apex Owner");
  const [email, setEmail] = useState("oulbachir2019@gmail.com");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!supabase) return;

    setSubmitting(true);
    setMessage("");

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onSignedIn();
        return;
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });
      if (error) throw error;
      const signupMessage =
        "Account created. Confirm the email, then log in. Dashboard access only activates for the owner or a coach email invited by the owner.";
      setMessage(signupMessage);
      onSignedUp(signupMessage);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <section className="auth-hero">
        <div className="hero-orbit hero-orbit-one" />
        <div className="hero-orbit hero-orbit-two" />
        <div className="hero-copy">
          <span className="eyebrow">Apex Gym</span>
          <h1>One secure workspace for the Apex admin and coaching team.</h1>
          <p>
            This dashboard is where we control the full business side of the app:
            plan limits, paid upgrades, coach capacity, ads, and launch readiness.
          </p>
        </div>
        <div className="hero-grid">
          <article>
            <Sparkles size={18} />
            <strong>Plans</strong>
            <span>Free, Plus, Pro entitlements in one place.</span>
          </article>
          <article>
            <ShieldCheck size={18} />
            <strong>Access</strong>
            <span>Admins and invited coaches get separate role-based workspaces.</span>
          </article>
          <article>
            <Mail size={18} />
            <strong>Billing</strong>
            <span>Ready for RevenueCat and Google Play products.</span>
          </article>
        </div>
      </section>

      <section className="auth-card">
        <div className="auth-mark">
          <LockKeyhole size={28} />
        </div>
        <h2>{mode === "login" ? "Team sign in" : "Create your account"}</h2>
        <p>Admins use the allowlisted owner email. Coaches use the email invited by the admin.</p>

        <div className="auth-role-note">
          <strong>Access is assigned automatically</strong>
          <span>Owner email → Admin Dashboard</span>
          <span>Invited coach email → Coach Portal</span>
          <span>Any other account → Access denied</span>
        </div>

        <div className="auth-tabs">
          <button
            className={mode === "login" ? "auth-tab auth-tab-active" : "auth-tab"}
            onClick={() => setMode("login")}
            type="button"
          >
            Log in
          </button>
          <button
            className={mode === "signup" ? "auth-tab auth-tab-active" : "auth-tab"}
            onClick={() => setMode("signup")}
            type="button"
          >
            Sign up
          </button>
        </div>

        <div className="auth-form">
          {mode === "signup" ? (
            <label>
              Full name
              <input onChange={(event) => setName(event.target.value)} value={name} />
            </label>
          ) : null}

          <label>
            Email
            <input
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              value={email}
            />
          </label>

          <label>
            Password
            <input
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              value={password}
            />
          </label>

          {message ? <div className="auth-message">{message}</div> : null}

          <button className="button button-primary button-wide" disabled={submitting} onClick={handleSubmit}>
            <span>{submitting ? "Please wait..." : mode === "login" ? "Open dashboard" : "Create account"}</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </section>
    </div>
  );
}
