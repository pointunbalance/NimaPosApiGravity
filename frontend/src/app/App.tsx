import { RouterProvider } from "react-router-dom";

import { LoginPage } from "../pages/LoginPage";
import { router } from "./router";
import { AuthProvider, useAuth } from "./providers/AuthProvider";
import { I18nProvider, useI18n } from "./providers/I18nProvider";

function AppContent() {
  const { session, loading } = useAuth();
  const { messages } = useI18n();

  if (loading) {
    return (
      <main className="auth-screen">
        <section className="auth-card">
          <span className="eyebrow">{messages.login.loadingEyebrow}</span>
          <h1>{messages.login.loadingTitle}</h1>
          <p>{messages.login.loadingMessage}</p>
        </section>
      </main>
    );
  }

  if (!session) {
    return <LoginPage />;
  }

  return <RouterProvider router={router} />;
}

export function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </I18nProvider>
  );
}
