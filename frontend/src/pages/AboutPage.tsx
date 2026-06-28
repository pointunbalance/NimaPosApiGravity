import { getApiBaseUrl } from "../app/api/client";
import { appMode, modeMeta } from "../app/config/appMode";
import { useAuth } from "../app/providers/AuthProvider";
import { useI18n } from "../app/providers/I18nProvider";
import { PageHeader } from "../components/PageHeader";

export function AboutPage() {
  const { session, activationRequired } = useAuth();
  const { messages } = useI18n();
  const copy = messages.about;

  return (
    <div className="page-stack">
      <PageHeader title={copy.title} subtitle={copy.subtitle} />

      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">{copy.editionEyebrow}</span>
          <h3>{modeMeta[appMode].label}</h3>
          <p>{modeMeta[appMode].description}</p>
        </article>

        <article className="surface-panel">
          <span className="eyebrow">{copy.runtimeEyebrow}</span>
          <ul className="mini-list">
            <li><strong>{copy.runtimeLabels.apiBaseUrl}</strong><span>{getApiBaseUrl()}</span></li>
            <li><strong>{copy.runtimeLabels.currentUser}</strong><span>{session?.user.username || copy.unknown}</span></li>
            <li><strong>{copy.runtimeLabels.role}</strong><span>{session?.user.role || copy.unknown}</span></li>
            <li><strong>{copy.runtimeLabels.activation}</strong><span>{activationRequired ? copy.activationOff : copy.activationOn}</span></li>
          </ul>
        </article>

        <article className="surface-panel accent-panel">
          <span className="eyebrow">{copy.notesEyebrow}</span>
          <h3>{copy.platformTitle}</h3>
          <p>{copy.platformBody}</p>
        </article>
      </section>
    </div>
  );
}
