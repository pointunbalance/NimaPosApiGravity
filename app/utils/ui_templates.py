"""HTML templates for API documentation (Swagger/Scalar) with Elite SaaS Aesthetics."""

# --- Shared CSS variables & utilities injected into both templates ---
_SHARED_CSS = """
    :root {
        /* Brand Palette */
        --brand-primary: #2563eb;
        --brand-primary-light: #3b82f6;
        --brand-primary-dark: #1d4ed8;
        --brand-gradient: linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #3b82f6 100%);
        --brand-gradient-hover: linear-gradient(135deg, #1e40af 0%, #1d4ed8 50%, #2563eb 100%);

        /* Light Theme (default) */
        --bg-page: #f8fafc;
        --bg-surface: #ffffff;
        --bg-surface-elevated: #ffffff;
        --bg-header: var(--brand-gradient);
        --text-heading: #0f172a;
        --text-body: #334155;
        --text-muted: #64748b;
        --text-on-brand: #ffffff;
        --border-color: #e2e8f0;
        --border-subtle: #f1f5f9;

        --success: #059669;
        --success-bg: #ecfdf5;
        --success-border: #a7f3d0;
        --error: #dc2626;
        --error-bg: #fef2f2;
        --error-border: #fecaca;
        --warning: #d97706;
        --warning-bg: #fffbeb;
        --warning-border: #fde68a;
        --info: #2563eb;
        --info-bg: #eff6ff;
        --info-border: #bfdbfe;

        --shadow-sm: 0 1px 2px 0 rgba(0,0,0,0.05);
        --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
        --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);

        --radius-sm: 6px;
        --radius-md: 10px;
        --radius-lg: 14px;
        --radius-xl: 20px;

        --font-sans: 'Inter', 'Tajawal', system-ui, -apple-system, sans-serif;
        --font-mono: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
        --font-heading: 'Inter', 'Tajawal', system-ui, sans-serif;
    }

    /* --- Dark Theme --- */
    html.dark {
        --bg-page: #0f172a;
        --bg-surface: #1e293b;
        --bg-surface-elevated: #1e293b;
        --bg-header: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
        --text-heading: #f1f5f9;
        --text-body: #cbd5e1;
        --text-muted: #94a3b8;
        --text-on-brand: #ffffff;
        --border-color: #334155;
        --border-subtle: #1e293b;

        --success-bg: #052e16;
        --success-border: #065f46;
        --error-bg: #450a0a;
        --error-border: #991b1b;
        --warning-bg: #451a03;
        --warning-border: #92400e;
        --info-bg: #172554;
        --info-border: #1e3a8a;

        --shadow-sm: 0 1px 2px 0 rgba(0,0,0,0.3);
        --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.4), 0 2px 4px -1px rgba(0,0,0,0.3);
        --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.4), 0 4px 6px -2px rgba(0,0,0,0.3);
    }

    html.dark body {
        background-color: var(--bg-page) !important;
        color: var(--text-body) !important;
    }

    /* --- Base Reset --- */
    *, *::before, *::after { box-sizing: border-box; }

    html, body {
        margin: 0;
        padding: 0;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        text-rendering: optimizeLegibility;
        transition: background-color 0.25s ease, color 0.25s ease;
    }

    /* --- Branded Header --- */
    .docs-header {
        background: var(--bg-header);
        padding: 0;
        position: sticky;
        top: 0;
        z-index: 1000;
        border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    .docs-header-inner {
        max-width: 1400px;
        margin: 0 auto;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 24px;
        gap: 16px;
    }
    .docs-brand {
        display: flex;
        align-items: center;
        gap: 12px;
        text-decoration: none;
    }
    .docs-brand-icon {
        width: 36px;
        height: 36px;
        background: rgba(255,255,255,0.2);
        border-radius: var(--radius-sm);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        font-weight: 800;
        color: white;
        backdrop-filter: blur(8px);
    }
    .docs-brand-text {
        color: white;
        font-family: var(--font-heading);
        font-weight: 700;
        font-size: 17px;
        letter-spacing: -0.02em;
    }
    .docs-brand-version {
        display: inline-flex;
        align-items: center;
        background: rgba(255,255,255,0.15);
        color: rgba(255,255,255,0.9);
        font-size: 11px;
        font-weight: 600;
        padding: 3px 8px;
        border-radius: 20px;
        letter-spacing: 0.02em;
        backdrop-filter: blur(8px);
        border: 1px solid rgba(255,255,255,0.1);
    }
    .docs-nav {
        display: flex;
        align-items: center;
        gap: 4px;
    }
    .docs-nav-link {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: rgba(255,255,255,0.75);
        text-decoration: none;
        font-family: var(--font-sans);
        font-size: 13px;
        font-weight: 500;
        padding: 6px 14px;
        border-radius: var(--radius-sm);
        transition: all 0.15s ease;
        border: 1px solid transparent;
    }
    .docs-nav-link:hover {
        color: white;
        background: rgba(255,255,255,0.1);
    }
    .docs-nav-link.active {
        color: white;
        background: rgba(255,255,255,0.15);
        border-color: rgba(255,255,255,0.15);
        font-weight: 600;
    }
    .docs-divider {
        width: 1px;
        height: 24px;
        background: rgba(255,255,255,0.2);
        margin: 0 8px;
    }
    .docs-theme-toggle {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border: 1px solid rgba(255,255,255,0.2);
        border-radius: var(--radius-sm);
        background: rgba(255,255,255,0.1);
        color: white;
        cursor: pointer;
        font-size: 16px;
        transition: all 0.15s ease;
        backdrop-filter: blur(8px);
    }
    .docs-theme-toggle:hover {
        background: rgba(255,255,255,0.2);
        border-color: rgba(255,255,255,0.3);
    }
    .docs-theme-toggle:active {
        transform: scale(0.95);
    }
    .docs-theme-toggle .icon-sun { display: none; }
    .docs-theme-toggle .icon-moon { display: inline; }
    html.dark .docs-theme-toggle .icon-sun { display: inline; }
    html.dark .docs-theme-toggle .icon-moon { display: none; }

    /* --- Responsive --- */
    @media (max-width: 640px) {
        .docs-header-inner { padding: 10px 16px; }
        .docs-brand-text { display: none; }
        .docs-nav-link span { display: none; }
        .docs-nav-link { padding: 6px 10px; }
    }
"""

# Light theme variables for Swagger (force light to prevent dark reader issues)
_SWAGGER_LIGHT_OVERRIDES = """
    /* Force strictly Light Theme when browser tries to go dark */
    :root {
        color-scheme: light !important;
    }
    @media (prefers-color-scheme: dark) {
        .swagger-ui h1, .swagger-ui h2, .swagger-ui h3, .swagger-ui h4, .swagger-ui h5, .swagger-ui h6,
        .swagger-ui .title, .swagger-ui span, .swagger-ui p, .swagger-ui li, .swagger-ui label {
            color: #f8fafc !important;
            text-shadow: 0 1px 2px rgba(0,0,0,0.8);
        }
        .swagger-ui .opblock-tag-section, .swagger-ui .opblock {
            border-color: #334155 !important;
            background-color: transparent !important;
        }
    }
    .swagger-ui h1, .swagger-ui h2, .swagger-ui h3, .swagger-ui h4, .swagger-ui h5, .swagger-ui h6,
    .swagger-ui .title, .swagger-ui span, .swagger-ui p, .swagger-ui li, .swagger-ui label, .swagger-ui td {
        color: currentColor;
        font-family: var(--font-sans) !important;
        font-weight: 700 !important;
    }
    .swagger-ui .opblock-summary-method,
    .swagger-ui .btn.execute,
    .swagger-ui .btn.execute span,
    .swagger-ui .download-url-button,
    .swagger-ui .download-url-button span {
        color: #ffffff !important;
    }
    .swagger-ui pre code, .swagger-ui pre span {
        color: #f8fafc !important;
    }
"""


def get_swagger_ui_html(title: str, openapi_url: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="en" dir="ltr" class="light" style="color-scheme: light;">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light only">
<meta name="darkreader-lock">
<title>{title} — Premium API Reference</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Tajawal:wght@400;500;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link type="text/css" rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css">
<style>
{_SHARED_CSS}

/* Swagger-specific overrides */
body {{
    background-color: var(--bg-page) !important;
    color: var(--text-body) !important;
    font-family: var(--font-sans) !important;
}}

{_SWAGGER_LIGHT_OVERRIDES}

/* Topbar replacement — hide default, show custom */
.swagger-ui .topbar {{
    background: var(--bg-header) !important;
    border-bottom: none !important;
    box-shadow: none !important;
    padding: 0 !important;
    height: 0 !important;
    overflow: hidden !important;
}}
.swagger-ui .topbar .download-url-wrapper {{
    display: none !important;
}}

/* Info section */
.swagger-ui .info {{
    margin: 40px auto !important;
    max-width: 800px !important;
}}
.swagger-ui .info .title {{
    color: var(--text-heading) !important;
    font-size: 36px !important;
    font-weight: 800 !important;
    letter-spacing: -0.025em !important;
    line-height: 1.2 !important;
}}
.swagger-ui .info p, .swagger-ui .info li {{
    color: var(--text-body) !important;
    line-height: 1.7 !important;
    font-size: 15px !important;
}}
.swagger-ui .info a {{
    color: var(--brand-primary) !important;
    text-decoration: none !important;
    font-weight: 600 !important;
}}
.swagger-ui .info a:hover {{
    text-decoration: underline !important;
}}

/* Wrapper */
.swagger-ui .wrapper {{
    max-width: 1200px !important;
    padding: 0 24px;
    margin-top: 20px;
}}

/* Tag sections (Categories) */
.swagger-ui .opblock-tag-section {{
    background: var(--bg-surface) !important;
    border: 1px solid var(--border-color) !important;
    border-radius: var(--radius-lg) !important;
    box-shadow: var(--shadow-md) !important;
    padding: 28px !important;
    margin-bottom: 32px !important;
    transition: box-shadow 0.2s ease, border-color 0.2s ease !important;
}}
.swagger-ui .opblock-tag-section:hover {{
    box-shadow: var(--shadow-lg) !important;
}}
.swagger-ui .opblock-tag {{
    border-bottom: 2px solid var(--border-color) !important;
    padding-bottom: 16px !important;
    margin-bottom: 24px !important;
    color: var(--text-heading) !important;
    font-size: 22px !important;
    font-weight: 700 !important;
    font-family: var(--font-heading) !important;
}}
.swagger-ui .opblock-tag small {{
    color: var(--text-muted) !important;
    font-size: 12px !important;
    font-weight: 500 !important;
    background: var(--bg-page) !important;
    padding: 4px 10px !important;
    border-radius: 20px !important;
    border: 1px solid var(--border-color) !important;
    margin-left: 12px;
}}

/* Operation Blocks */
.swagger-ui .opblock {{
    background: var(--bg-surface) !important;
    border: 1px solid var(--border-color) !important;
    border-radius: var(--radius-md) !important;
    box-shadow: var(--shadow-sm) !important;
    margin-bottom: 12px !important;
    transition: border-color 0.15s ease, box-shadow 0.15s ease !important;
}}
.swagger-ui .opblock:hover {{
    border-color: #cbd5e1 !important;
    box-shadow: var(--shadow-md) !important;
}}
.swagger-ui .opblock .opblock-summary {{
    padding: 12px 16px !important;
    border-bottom: 1px solid transparent !important;
}}
.swagger-ui .opblock.is-open .opblock-summary {{
    border-bottom: 1px solid var(--border-color) !important;
}}
.swagger-ui .opblock .opblock-summary-path {{
    font-family: var(--font-mono) !important;
    font-size: 13px !important;
    color: var(--text-heading) !important;
    font-weight: 600 !important;
}}
.swagger-ui .opblock .opblock-summary-description {{
    color: var(--text-muted) !important;
    font-size: 13px !important;
}}

/* Method Badges */
.swagger-ui .opblock .opblock-summary-method {{
    border-radius: var(--radius-sm) !important;
    padding: 6px 12px !important;
    font-weight: 700 !important;
    font-size: 12px !important;
    min-width: 72px !important;
    text-align: center !important;
    text-shadow: none !important;
    letter-spacing: 0.03em !important;
}}

.swagger-ui .opblock.opblock-post {{
    border-left: 4px solid var(--info) !important;
}}
.swagger-ui .opblock.opblock-post .opblock-summary-method {{
    background: var(--info) !important;
    color: white !important;
}}
.swagger-ui .opblock.opblock-post .opblock-summary {{
    background: var(--info-bg) !important;
}}

.swagger-ui .opblock.opblock-get {{
    border-left: 4px solid var(--success) !important;
}}
.swagger-ui .opblock.opblock-get .opblock-summary-method {{
    background: var(--success) !important;
    color: white !important;
}}
.swagger-ui .opblock.opblock-get .opblock-summary {{
    background: var(--success-bg) !important;
}}

.swagger-ui .opblock.opblock-put {{
    border-left: 4px solid var(--warning) !important;
}}
.swagger-ui .opblock.opblock-put .opblock-summary-method {{
    background: var(--warning) !important;
    color: white !important;
}}
.swagger-ui .opblock.opblock-put .opblock-summary {{
    background: var(--warning-bg) !important;
}}

.swagger-ui .opblock.opblock-delete {{
    border-left: 4px solid var(--error) !important;
}}
.swagger-ui .opblock.opblock-delete .opblock-summary-method {{
    background: var(--error) !important;
    color: white !important;
}}
.swagger-ui .opblock.opblock-delete .opblock-summary {{
    background: var(--error-bg) !important;
}}

.swagger-ui .opblock.opblock-patch {{
    border-left: 4px solid #8b5cf6 !important;
}}
.swagger-ui .opblock.opblock-patch .opblock-summary-method {{
    background: #8b5cf6 !important;
    color: white !important;
}}
.swagger-ui .opblock.opblock-patch .opblock-summary {{
    background: #f5f3ff !important;
}}

/* Tables */
.swagger-ui table thead tr td, .swagger-ui table thead tr th {{
    color: var(--text-heading) !important;
    border-bottom: 2px solid var(--border-color) !important;
    font-weight: 600 !important;
}}
.swagger-ui table tbody tr td {{
    color: var(--text-body) !important;
    border-bottom: 1px solid var(--border-subtle) !important;
}}

/* Models section */
.swagger-ui section.models {{
    border: 1px solid var(--border-color) !important;
    border-radius: var(--radius-lg) !important;
    background: var(--bg-surface) !important;
    margin-top: 40px !important;
    box-shadow: var(--shadow-md) !important;
}}
.swagger-ui section.models h4 {{
    border-bottom: 1px solid var(--border-color) !important;
    display: flex;
    align-items: center;
}}

/* Code blocks */
.swagger-ui pre {{
    background: #1e293b !important;
    border-radius: var(--radius-md) !important;
    padding: 16px !important;
}}
.swagger-ui pre code, .swagger-ui pre span {{
    color: #f8fafc !important;
    font-family: var(--font-mono) !important;
    font-size: 13px !important;
}}
.swagger-ui .microlight {{
    background: #1e293b !important;
    color: #f8fafc !important;
    border-radius: var(--radius-md) !important;
    font-family: var(--font-mono) !important;
}}

/* Buttons */
.swagger-ui .btn {{
    background: var(--bg-surface) !important;
    color: var(--text-heading) !important;
    border: 1px solid var(--border-color) !important;
    border-radius: var(--radius-sm) !important;
    font-weight: 600 !important;
    text-transform: none !important;
    box-shadow: inset 0 -1px 0 0 rgba(0,0,0,0.05) !important;
    transition: all 0.15s ease !important;
}}
.swagger-ui .btn:hover {{
    box-shadow: var(--shadow-sm) !important;
}}
.swagger-ui .btn.execute {{
    background: var(--brand-primary) !important;
    color: white !important;
    border: 1px solid var(--brand-primary-dark) !important;
}}
.swagger-ui .btn.execute:hover {{
    background: var(--brand-primary-dark) !important;
}}

/* Inputs */
.swagger-ui input[type=text],
.swagger-ui input[type=password],
.swagger-ui textarea,
.swagger-ui select {{
    background: var(--bg-surface) !important;
    border: 1px solid var(--border-color) !important;
    color: var(--text-heading) !important;
    border-radius: var(--radius-sm) !important;
    padding: 8px 12px !important;
    font-family: var(--font-sans) !important;
    transition: border-color 0.15s ease, box-shadow 0.15s ease !important;
}}
.swagger-ui input:focus,
.swagger-ui textarea:focus,
.swagger-ui select:focus {{
    border-color: var(--brand-primary) !important;
    outline: none !important;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15) !important;
}}

/* Filter Search */
.swagger-ui .filter-container .operation-filter-input {{
    border: 2px solid var(--border-color) !important;
    border-radius: var(--radius-lg) !important;
    padding: 14px 20px !important;
    font-size: 15px !important;
    margin: 0 auto 24px auto !important;
    background: var(--bg-surface) !important;
    color: var(--text-heading) !important;
    max-width: 100% !important;
    box-shadow: var(--shadow-sm) !important;
    transition: border-color 0.15s ease, box-shadow 0.15s ease !important;
}}
.swagger-ui .filter-container .operation-filter-input:focus {{
    border-color: var(--brand-primary) !important;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15) !important;
}}

.swagger-ui .property-row td {{
    color: var(--text-body) !important;
}}
.swagger-ui .model-title {{
    color: var(--text-heading) !important;
    font-family: var(--font-mono) !important;
}}

/* Scrollbar */
::-webkit-scrollbar {{ width: 8px; height: 8px; }}
::-webkit-scrollbar-track {{ background: var(--bg-page); }}
::-webkit-scrollbar-thumb {{ background: var(--border-color); border-radius: 4px; }}
::-webkit-scrollbar-thumb:hover {{ background: var(--text-muted); }}
</style>
</head>
<body>

<!-- Branded Header -->
<header class="docs-header">
  <div class="docs-header-inner">
    <a href="/docs" class="docs-brand">
      <div class="docs-brand-icon">N</div>
      <span class="docs-brand-text">NimaPOS API</span>
      <span class="docs-brand-version">v2.32.0</span>
    </a>
    <nav class="docs-nav">
      <a href="/docs" class="docs-nav-link active">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
        <span>Swagger</span>
      </a>
      <a href="/scalar" class="docs-nav-link">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
        <span>Scalar</span>
      </a>
      <div class="docs-divider"></div>
      <a href="/" class="docs-nav-link">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        <span>App</span>
      </a>
      <div class="docs-divider"></div>
      <button class="docs-theme-toggle" onclick="toggleTheme()" title="Toggle dark mode" aria-label="Toggle dark mode">
        <span class="icon-moon">🌙</span>
        <span class="icon-sun">☀️</span>
      </button>
    </nav>
  </div>
</header>

<div id="swagger-ui"></div>

<script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
<script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
<script>
function toggleTheme() {{
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    localStorage.setItem('nima-docs-theme', isDark ? 'dark' : 'light');
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
    document.documentElement.setAttribute('style', 'color-scheme: ' + (isDark ? 'dark' : 'light') + ' !important;');
}}
(function() {{
    const saved = localStorage.getItem('nima-docs-theme');
    if (saved === 'dark') {{
        document.documentElement.classList.add('dark');
        document.documentElement.style.colorScheme = 'dark';
        document.documentElement.setAttribute('style', 'color-scheme: dark !important;');
    }}
}})();
window.onload = () => {{
    window.ui = SwaggerUIBundle({{
        url: "{openapi_url}",
        dom_id: '#swagger-ui',
        presets: [
            SwaggerUIBundle.presets.apis,
            SwaggerUIStandalonePreset
        ],
        layout: "StandaloneLayout",
        deepLinking: true,
        displayRequestDuration: true,
        docExpansion: "none",
        filter: true,
        tryItOutEnabled: true
    }});
}};
</script>
</body>
</html>"""


def get_scalar_ui_html(title: str, openapi_url: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="darkreader-lock">
<title>{title} — Developer API Reference</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Tajawal:wght@400;500;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
{_SHARED_CSS}

/* Scalar-specific overrides */
body {{
    margin: 0;
    padding: 0;
    background: var(--bg-page);
    color: var(--text-body);
    font-family: var(--font-sans);
    transition: background-color 0.25s ease, color 0.25s ease;
}}

/* Override Scalar CSS Variables */
.scalar-app, .scalar-theme-default {{
    --scalar-color-1: var(--text-heading) !important;
    --scalar-color-2: var(--text-body) !important;
    --scalar-color-3: var(--text-muted) !important;
    --scalar-color-accent: var(--brand-primary) !important;

    --scalar-background-1: var(--bg-page) !important;
    --scalar-background-2: var(--bg-surface) !important;
    --scalar-background-3: var(--bg-surface-elevated) !important;
    --scalar-background-accent: var(--info-bg) !important;

    --scalar-border-color: var(--border-color) !important;

    --scalar-font: var(--font-sans) !important;
    --scalar-font-code: var(--font-mono) !important;
}}

/* Sidebar styling */
.scalar-app [data-testid="sidebar"] {{
    border-right: 1px solid var(--border-color) !important;
}}
.scalar-app [data-testid="sidebar"] .active {{
    background: var(--info-bg) !important;
    border-radius: var(--radius-sm) !important;
    color: var(--brand-primary) !important;
    font-weight: 600 !important;
}}

/* Dark theme for Scalar */
html.dark .scalar-app, html.dark .scalar-theme-default {{
    --scalar-color-1: #f1f5f9 !important;
    --scalar-color-2: #cbd5e1 !important;
    --scalar-color-3: #94a3b8 !important;
    --scalar-background-1: #0f172a !important;
    --scalar-background-2: #1e293b !important;
    --scalar-background-3: #1e293b !important;
    --scalar-background-accent: #172554 !important;
    --scalar-border-color: #334155 !important;
}}

/* Scrollbar */
::-webkit-scrollbar {{ width: 8px; height: 8px; }}
::-webkit-scrollbar-track {{ background: var(--bg-page); }}
::-webkit-scrollbar-thumb {{ background: var(--border-color); border-radius: 4px; }}
::-webkit-scrollbar-thumb:hover {{ background: var(--text-muted); }}
</style>
</head>
<body class="scalar-theme-default">

<!-- Branded Header -->
<header class="docs-header">
  <div class="docs-header-inner">
    <a href="/scalar" class="docs-brand">
      <div class="docs-brand-icon">N</div>
      <span class="docs-brand-text">NimaPOS API</span>
      <span class="docs-brand-version">v2.32.0</span>
    </a>
    <nav class="docs-nav">
      <a href="/docs" class="docs-nav-link">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
        <span>Swagger</span>
      </a>
      <a href="/scalar" class="docs-nav-link active">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
        <span>Scalar</span>
      </a>
      <div class="docs-divider"></div>
      <a href="/" class="docs-nav-link">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        <span>App</span>
      </a>
      <div class="docs-divider"></div>
      <button class="docs-theme-toggle" onclick="toggleTheme()" title="Toggle dark mode" aria-label="Toggle dark mode">
        <span class="icon-moon">🌙</span>
        <span class="icon-sun">☀️</span>
      </button>
    </nav>
  </div>
</header>

<script
  id="api-reference"
  data-url="{openapi_url}"
  data-configuration='{{
    "theme": "none",
    "metaData": {{
      "title": "{title} - Enterprise API"
    }},
    "layout": "modern",
    "searchHotKey": "k",
    "showSidebar": true,
    "forceShowOperations": true,
    "hideModels": false,
    "darkMode": false,
    "hideDarkModeToggle": true
  }}'
></script>
<script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
<script>
function toggleTheme() {{
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    localStorage.setItem('nima-docs-theme', isDark ? 'dark' : 'light');
}}
(function() {{
    const saved = localStorage.getItem('nima-docs-theme');
    if (saved === 'dark') {{
        document.documentElement.classList.add('dark');
    }}
}})();
</script>
</body>
</html>"""
