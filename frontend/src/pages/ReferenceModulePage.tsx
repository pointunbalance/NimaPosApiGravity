import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";

import { appMode } from "../app/config/appMode";
import { routeCatalog } from "../app/config/routeCatalog";
import { useI18n } from "../app/providers/I18nProvider";
import { PageHeader } from "../components/PageHeader";

export function ReferenceModulePage() {
  const location = useLocation();
  const { messages } = useI18n();
  const copy = messages.reference;
  const route = useMemo(
    () => routeCatalog.find((item) => item.path === location.pathname),
    [location.pathname]
  );

  const availableInMode = route ? route.modes.includes(appMode) : false;
  const relatedRoutes = useMemo(() => {
    if (!route) return [];
    return routeCatalog
      .filter((item) => item.group === route.group && item.path !== route.path && item.modes.includes(appMode))
      .slice(0, 6);
  }, [route]);

  const implementedInGroup = useMemo(() => {
    if (!route) return 0;
    return routeCatalog.filter((item) => item.group === route.group && item.implemented).length;
  }, [route]);

  const totalInGroup = useMemo(() => {
    if (!route) return 0;
    return routeCatalog.filter((item) => item.group === route.group).length;
  }, [route]);

  return (
    <div className="page-stack">
      <PageHeader title={route?.label || copy.defaultTitle} subtitle={route?.description || copy.defaultSubtitle} />

      <section className="hero-panel">
        <div className="hero-copy">
          <span className="eyebrow">{copy.heroEyebrow}</span>
          <h2>{route?.label || copy.heroTitle}</h2>
          <p>{copy.heroBody}</p>
        </div>
        <div className="hero-metric">
          <strong>{route?.path || location.pathname}</strong>
          <span>
            {copy.currentMode}: {appMode}
          </span>
          <span>{route ? messages.navigation.groups[route.group] : copy.unknownGroup}</span>
        </div>
      </section>

      <section className="settings-layout">
        <article className="surface-panel">
          <span className="eyebrow">{copy.statusEyebrow}</span>
          <h3>{copy.statusTitle}</h3>
          <ul className="mini-list reference-mini-list">
            <li>
              <strong>{copy.bindingLabel}</strong>
              <span>{route?.implemented ? copy.bindingConnected : copy.bindingReference}</span>
            </li>
            <li>
              <strong>{copy.modeLabel}</strong>
              <span>{availableInMode ? copy.modeAvailable : copy.modeUnavailable}</span>
            </li>
            <li>
              <strong>{copy.progressLabel}</strong>
              <span>
                {implementedInGroup}/{totalInGroup}
              </span>
            </li>
          </ul>
        </article>

        <article className="surface-panel">
          <span className="eyebrow">{copy.nextStepEyebrow}</span>
          <h3>{copy.nextStepTitle}</h3>
          <p>{availableInMode ? copy.nextStepAvailable : copy.nextStepUnavailable}</p>
        </article>

        <article className="surface-panel">
          <span className="eyebrow">{copy.sourceEyebrow}</span>
          <h3>{copy.sourceTitle}</h3>
          <p>{copy.sourceBody}</p>
        </article>
      </section>

      <section className="surface-panel">
        <span className="eyebrow">{copy.nearbyEyebrow}</span>
        <h3>{copy.nearbyTitle}</h3>
        <p>{copy.nearbyBody}</p>

        <div className="reference-links-grid">
          {relatedRoutes.length ? (
            relatedRoutes.map((item) => (
              <Link key={item.path} className="reference-link-card" to={item.path}>
                <div>
                  <strong>{item.label}</strong>
                  <p>{item.description}</p>
                </div>
                <span className="status-chip">{item.implemented ? copy.bindingConnected : copy.bindingReference}</span>
              </Link>
            ))
          ) : (
            <div className="reference-empty-state">{copy.emptyNearby}</div>
          )}
        </div>
      </section>
    </div>
  );
}
