import { Boxes, FileText, Languages, Menu, MoonStar, ShoppingCart, SunMedium } from "lucide-react";
import { useMemo, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";

import { appMode, modeMeta } from "../config/appMode";
import { getVisibleNavigation } from "../config/navigation";
import { useAuth } from "../providers/AuthProvider";
import { useI18n } from "../providers/I18nProvider";

function formatToday(locale: string) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(new Date());
}

const extensionIcons = [<Boxes key="inventory" size={18} />, <FileText key="finance" size={18} />, <ShoppingCart key="channels" size={18} />];

export function AppShell() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const { session, signOut } = useAuth();
  const { locale, messages, toggleLocale } = useI18n();
  const groups = useMemo(() => getVisibleNavigation(appMode, messages.navigation.groups), [messages.navigation.groups]);
  const currentMeta = modeMeta[appMode];

  return (
    <div className={`app-shell ${theme === "dark" ? "theme-dark" : ""}`}>
      <aside className={`sidebar ${sidebarOpen ? "is-open" : ""}`}>
        <div className="brand-panel">
          <div className="brand-mark">N</div>
          <div>
            <p className="eyebrow">{messages.shell.brandEyebrow}</p>
            <h1>{messages.shell.brandTitle}</h1>
          </div>
        </div>

        <div className="mode-panel">
          <span className="mode-pill">{currentMeta.label}</span>
          <p>{currentMeta.description}</p>
        </div>

        <nav className="nav-groups">
          {groups.map((group) => (
            <section key={group.id} className="nav-group">
              <p className="nav-group-title">{group.label}</p>
              <div className="nav-items">
                {group.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) => `nav-item ${isActive ? "is-active" : ""}`}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span>
                      <strong>{item.label}</strong>
                      <small>{item.description}</small>
                    </span>
                  </NavLink>
                ))}
              </div>
            </section>
          ))}
        </nav>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <button className="icon-button mobile-only" onClick={() => setSidebarOpen((open) => !open)} type="button">
            <Menu size={18} />
          </button>

          <div className="topbar-copy">
            <span className="eyebrow">{messages.shell.topbarEyebrow}</span>
            <h2>{formatToday(locale)}</h2>
          </div>

          <div className="topbar-tools">
            <div className="status-chip">
              <span className="status-dot" />
              {messages.shell.currentPath}: {location.pathname === "/" ? messages.shell.dashboardPath : location.pathname.replace("/", "")}
            </div>
            <div className="status-chip">
              <span>{session?.user.username}</span>
              <span className="chip-divider">|</span>
              <span>{session?.user.role}</span>
            </div>
            <button className="icon-button" onClick={toggleLocale} type="button" title={messages.shell.switchLocale}>
              <Languages size={18} />
            </button>
            <button
              className="icon-button"
              onClick={() => setTheme((value) => (value === "light" ? "dark" : "light"))}
              type="button"
            >
              {theme === "light" ? <MoonStar size={18} /> : <SunMedium size={18} />}
            </button>
            <button className="secondary-button" onClick={signOut} type="button">
              {messages.shell.signOut}
            </button>
          </div>
        </header>

        <main className="content-frame">
          <section className="starter-banner">
            {messages.shell.extensionCards.map((card, index) => (
              <article className="starter-banner-card" key={card.title}>
                <span className="starter-banner-icon">{extensionIcons[index]}</span>
                <div>
                  <h3>{card.title}</h3>
                  <p>{card.hint}</p>
                </div>
              </article>
            ))}
          </section>

          <Outlet />
        </main>
      </div>
    </div>
  );
}
