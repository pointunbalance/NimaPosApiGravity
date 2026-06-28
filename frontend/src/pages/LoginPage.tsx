import { FormEvent, useState } from "react";

import { getApiBaseUrl } from "../app/api/client";
import { getReadableAuthError, useAuth } from "../app/providers/AuthProvider";
import { useI18n } from "../app/providers/I18nProvider";

export function LoginPage() {
  const { activationRequired, error, signIn } = useAuth();
  const { messages } = useI18n();
  const [pin, setPin] = useState("");
  const [branchId, setBranchId] = useState("1");
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setLocalError(null);

    try {
      await signIn(pin, Number(branchId) || 1);
    } catch (caught) {
      setLocalError(getReadableAuthError(caught));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-screen">
      <section className="auth-card">
        <span className="eyebrow">{messages.login.eyebrow}</span>
        <h1>{messages.login.title}</h1>
        <p>{messages.login.subtitle}</p>

        {activationRequired ? (
          <div className="feedback-panel error-panel">
            <strong>{messages.login.activationTitle}</strong>
            <p>{messages.login.activationMessage}</p>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              <span>{messages.login.pinLabel}</span>
              <input
                autoComplete="one-time-code"
                inputMode="numeric"
                onChange={(event) => setPin(event.target.value)}
                placeholder={messages.login.pinPlaceholder}
                value={pin}
              />
            </label>

            <label>
              <span>{messages.login.branchLabel}</span>
              <input
                inputMode="numeric"
                onChange={(event) => setBranchId(event.target.value)}
                placeholder={messages.login.branchPlaceholder}
                value={branchId}
              />
            </label>

            <button className="primary-button" disabled={submitting || !pin.trim()} type="submit">
              {submitting ? messages.login.submitLoading : messages.login.submitIdle}
            </button>
          </form>
        )}

        {(localError || error) && (
          <div className="feedback-panel error-panel">
            <strong>{messages.login.sessionErrorTitle}</strong>
            <p>{localError || error}</p>
          </div>
        )}

        <div className="feedback-panel">
          <strong>{messages.login.apiBaseUrl}</strong>
          <p>{getApiBaseUrl()}</p>
        </div>
      </section>
    </main>
  );
}
