"""HTML templates for API documentation (Swagger/Scalar) with Elite SaaS Aesthetics."""

def get_swagger_ui_html(title: str, openapi_url: str) -> str:
    return f"""
    <!DOCTYPE html>
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
        /* Force strictly Light Theme and prevent browser auto-dark mode inversion / Dark Reader */
        :root {{
            color-scheme: light !important;
            --brand-primary: #2563eb;
            --brand-hover: #1d4ed8;
            --bg-page: #f8fafc;
            --bg-surface: #ffffff;
            --text-heading: #0f172a;
            --text-body: #334155;
            --text-muted: #64748b;
            --border-color: #e2e8f0;
            
            --success: #059669;
            --success-bg: #ecfdf5;
            --error: #dc2626;
            --error-bg: #fef2f2;
            --warning: #d97706;
            --warning-bg: #fffbeb;
            --info: #2563eb;
            --info-bg: #eff6ff;
        }}

        html, body {{
            background-color: #f8fafc !important; /* Force explicit hex to defeat variables rewrite */
            color: #334155 !important;
            font-family: 'Inter', 'Tajawal', sans-serif !important;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
        }}

        /* Neutralize Browser Dark Mode Extensions by using specific text shadows and resilient colors */
        .swagger-ui * {{
            font-family: inherit;
        }}

        /* If the browser forces the background to be dark, we force the text to be light */
        @media (prefers-color-scheme: dark) {{
            .swagger-ui h1, .swagger-ui h2, .swagger-ui h3, .swagger-ui h4, .swagger-ui h5, .swagger-ui h6,
            .swagger-ui .title, .swagger-ui span, .swagger-ui p, .swagger-ui li, .swagger-ui label {{
                color: #f8fafc !important; /* Force light text on dark forced bg */
                text-shadow: 0 1px 2px rgba(0,0,0,0.8);
            }}
            .swagger-ui .opblock-tag-section, .swagger-ui .opblock {{
                border-color: #334155 !important;
                background-color: transparent !important;
            }}
        }}

        /* Default forced styling (Fallback) */
        .swagger-ui h1, .swagger-ui h2, .swagger-ui h3, .swagger-ui h4, .swagger-ui h5, .swagger-ui h6,
        .swagger-ui .title, .swagger-ui span, .swagger-ui p, .swagger-ui li, .swagger-ui label, .swagger-ui td {{
            color: currentColor; /* Let it inherit, Dark Reader handles this better than forced hex */
            font-family: 'Inter', 'Tajawal', sans-serif !important;
            font-weight: 700 !important;
        }}

        /* Exception: we want white text on filled color backgrounds and buttons */
        .swagger-ui .opblock-summary-method,
        .swagger-ui .btn.execute,
        .swagger-ui .btn.execute span,
        .swagger-ui .download-url-button,
        .swagger-ui .download-url-button span {{
            color: #ffffff !important;
        }}

        /* Exception: keep code and parameter names legible */
        .swagger-ui pre code, .swagger-ui pre span {{
            color: #f8fafc !important;
        }}

        /* Topbar styling */
        .swagger-ui .topbar {{
            background-color: var(--bg-surface) !important;
            border-bottom: 1px solid var(--border-color) !important;
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important;
            padding: 16px 0 !important;
        }}
        .swagger-ui .topbar .download-url-wrapper input[type=text] {{
            border: 1px solid var(--border-color) !important;
            border-radius: 8px 0 0 8px !important;
            background: var(--bg-page) !important;
            color: var(--text-heading) !important;
        }}
        .swagger-ui .topbar .download-url-wrapper .download-url-button {{
            background-color: var(--brand-primary) !important;
            color: #ffffff !important;
            border-radius: 0 8px 8px 0 !important;
            font-weight: 600 !important;
            border: none !important;
        }}

        /* Info section */
        .swagger-ui .info {{
            margin: 60px auto !important;
        }}
        .swagger-ui .info .title {{
            color: var(--text-heading) !important;
            font-size: 42px !important;
            font-weight: 800 !important;
            letter-spacing: -0.02em !important;
        }}
        .swagger-ui .info p, .swagger-ui .info li {{
            color: var(--text-body) !important;
            line-height: 1.7 !important;
            font-size: 16px !important;
        }}
        .swagger-ui .info a {{
            color: var(--brand-primary) !important;
            text-decoration: none !important;
            font-weight: 600 !important;
        }}

        /* Layout wrapper */
        .swagger-ui .wrapper {{
            max-width: 1200px !important;
            padding: 0 20px;
        }}

        /* Tag sections (Categories) */
        .swagger-ui .opblock-tag-section {{
            background: var(--bg-surface) !important;
            border: 1px solid var(--border-color) !important;
            border-radius: 12px !important;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
            padding: 24px !important;
            margin-bottom: 40px !important;
        }}
        .swagger-ui .opblock-tag {{
            border-bottom: 2px solid var(--border-color) !important;
            padding-bottom: 16px !important;
            margin-bottom: 24px !important;
            color: var(--text-heading) !important;
            font-size: 24px !important;
            font-weight: 700 !important;
        }}
        .swagger-ui .opblock-tag small {{
            color: var(--text-muted) !important;
            font-size: 14px !important;
            font-weight: 500 !important;
            background: var(--bg-page) !important;
            padding: 6px 12px !important;
            border-radius: 16px !important;
            border: 1px solid var(--border-color) !important;
            margin-left: 12px;
        }}

        /* Operation Blocks */
        .swagger-ui .opblock {{
            background: var(--bg-surface) !important;
            border: 1px solid var(--border-color) !important;
            border-radius: 8px !important;
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important;
            margin-bottom: 16px !important;
            transition: border-color 0.2s, box-shadow 0.2s !important;
        }}
        .swagger-ui .opblock:hover {{
            border-color: #cbd5e1 !important;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
        }}

        /* Opblock summaries */
        .swagger-ui .opblock .opblock-summary {{
            padding: 12px 16px !important;
            border-bottom: 1px solid transparent !important;
        }}
        .swagger-ui .opblock.is-open .opblock-summary {{
            border-bottom: 1px solid var(--border-color) !important;
        }}

        .swagger-ui .opblock .opblock-summary-path {{
            font-family: 'JetBrains Mono', monospace !important;
            font-size: 14px !important;
            color: var(--text-heading) !important;
            font-weight: 600 !important;
        }}
        .swagger-ui .opblock .opblock-summary-description {{
            color: var(--text-muted) !important;
            font-size: 14px !important;
        }}

        /* Method Badges */
        .swagger-ui .opblock .opblock-summary-method {{
            border-radius: 6px !important;
            padding: 6px 12px !important;
            font-weight: 700 !important;
            font-size: 13px !important;
            min-width: 80px !important;
            text-align: center !important;
            text-shadow: none !important;
        }}
        .swagger-ui .opblock.opblock-post {{ border-left: 4px solid var(--info) !important; }}
        .swagger-ui .opblock.opblock-post .opblock-summary-method {{ background: var(--info) !important; color: white !important; }}
        .swagger-ui .opblock.opblock-post .opblock-summary {{ background: var(--info-bg) !important; }}

        .swagger-ui .opblock.opblock-get {{ border-left: 4px solid var(--success) !important; }}
        .swagger-ui .opblock.opblock-get .opblock-summary-method {{ background: var(--success) !important; color: white !important; }}
        .swagger-ui .opblock.opblock-get .opblock-summary {{ background: var(--success-bg) !important; }}

        .swagger-ui .opblock.opblock-put {{ border-left: 4px solid var(--warning) !important; }}
        .swagger-ui .opblock.opblock-put .opblock-summary-method {{ background: var(--warning) !important; color: white !important; }}
        .swagger-ui .opblock.opblock-put .opblock-summary {{ background: var(--warning-bg) !important; }}

        .swagger-ui .opblock.opblock-delete {{ border-left: 4px solid var(--error) !important; }}
        .swagger-ui .opblock.opblock-delete .opblock-summary-method {{ background: var(--error) !important; color: white !important; }}
        .swagger-ui .opblock.opblock-delete .opblock-summary {{ background: var(--error-bg) !important; }}

        /* Code & Tables inside operations */
        .swagger-ui .opblock-body {{
            background: var(--bg-surface) !important;
        }}
        .swagger-ui table thead tr td, .swagger-ui table thead tr th {{
            color: var(--text-heading) !important;
            border-bottom: 2px solid var(--border-color) !important;
            font-weight: 600 !important;
        }}
        .swagger-ui table tbody tr td {{
            color: var(--text-body) !important;
            border-bottom: 1px solid var(--border-color) !important;
        }}

        .swagger-ui section.models {{
            border: 1px solid var(--border-color) !important;
            border-radius: 12px !important;
            background: var(--bg-surface) !important;
            margin-top: 40px !important;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
        }}
        .swagger-ui section.models h4 {{
            border-bottom: 1px solid var(--border-color) !important;
            display: flex;
            align-items: center;
        }}

        /* Code blocks */
        .swagger-ui pre {{
            background: #1e293b !important;
            border-radius: 8px !important;
            padding: 16px !important;
        }}
        .swagger-ui pre code, .swagger-ui pre span {{
            color: #f8fafc !important;
            font-family: 'JetBrains Mono', monospace !important;
            font-size: 13px !important;
        }}
        
        .swagger-ui .microlight {{
            background: #1e293b !important;
            color: #f8fafc !important;
            border-radius: 8px !important;
            font-family: 'JetBrains Mono', monospace !important;
        }}

        /* Execute Buttons */
        .swagger-ui .btn {{
            background: var(--bg-surface) !important;
            color: var(--text-heading) !important;
            border: 1px solid var(--border-color) !important;
            border-radius: 6px !important;
            font-weight: 600 !important;
            text-transform: none !important;
            box-shadow: inset 0 -1px 0 0 rgba(0,0,0,0.05) !important;
        }}
        .swagger-ui .btn.execute {{
            background: var(--brand-primary) !important;
            color: white !important;
            border: 1px solid var(--brand-hover) !important;
        }}
        .swagger-ui .btn.execute:hover {{
            background: var(--brand-hover) !important;
        }}

        /* Inputs */
        .swagger-ui input[type=text], .swagger-ui input[type=password], .swagger-ui textarea, .swagger-ui select {{
            background: var(--bg-surface) !important;
            border: 1px solid var(--border-color) !important;
            color: var(--text-heading) !important;
            border-radius: 6px !important;
            padding: 8px 12px !important;
            font-family: 'Inter', sans-serif !important;
        }}
        .swagger-ui input:focus, .swagger-ui textarea:focus, .swagger-ui select:focus {{
            border-color: var(--brand-primary) !important;
            outline: none !important;
            box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2) !important;
        }}
        
        /* Filter Search Box */
        .swagger-ui .filter-container .operation-filter-input {{
            border: 2px solid var(--border-color) !important;
            border-radius: 12px !important;
            padding: 16px 20px !important;
            font-size: 16px !important;
            margin: 0 auto 30px auto !important;
            background: var(--bg-surface) !important;
            color: var(--text-heading) !important;
            max-width: 100% !important;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05) !important;
        }}
        
        .swagger-ui .property-row td {{
            color: var(--text-body) !important;
        }}
        .swagger-ui .model-title {{
            color: var(--text-heading) !important;
            font-family: 'JetBrains Mono', monospace !important;
        }}
    </style>
    </head>
    <body>
    <div id="swagger-ui"></div>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
    <script>
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
            filter: true
        }});
    }};
    </script>
    </body>
    </html>
    """

def get_scalar_ui_html(title: str, openapi_url: str) -> str:
    return f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <title>{title} — Developer API Reference</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="darkreader-lock">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Tajawal:wght@400;500;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
        <style>
            :root {{
                color-scheme: light dark;
            }}
            body {{
                margin: 0;
                padding: 0;
            }}
            
            /* Override Scalar CSS Variables for a pristine enterprise Light Theme */
            .scalar-app, .scalar-theme-default {{
                --scalar-color-1: currentColor !important;
                --scalar-color-2: inherit !important;
                --scalar-color-3: inherit !important;
                --scalar-color-accent: #2563eb !important;
                
                --scalar-background-1: inherit !important;
                --scalar-background-2: inherit !important;
                --scalar-background-3: inherit !important;
                --scalar-background-accent: rgba(37, 99, 235, 0.1) !important;
                
                --scalar-border-color: #e2e8f0 !important;
                
                --scalar-font: 'Inter', 'Tajawal', system-ui, sans-serif !important;
                --scalar-font-code: 'JetBrains Mono', monospace !important;
            }}
            
            .scalar-app [data-testid="sidebar"] {{
                border-right: 1px solid var(--scalar-border-color) !important;
            }}
            .scalar-app [data-testid="sidebar"] .active {{
                background: var(--scalar-background-accent) !important;
                border-radius: 6px !important;
                color: var(--scalar-color-accent) !important;
                font-weight: 600 !important;
            }}
            
            @media (prefers-color-scheme: dark) {{
                .scalar-app, .scalar-theme-default {{
                    --scalar-border-color: #334155 !important;
                }}
            }}
        </style>
    </head>
    <body class="scalar-theme-default">
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
    </body>
    </html>
    """
