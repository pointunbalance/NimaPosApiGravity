# Nima UI Master Reference

## Goal

This file is the official master reference for designing future Nima sales applications.

It is based primarily on the richer `nima-pos v1.54` UI snapshot and should be preferred over older ad-hoc references when making new UI decisions.

Supporting source documents:

- [V154_UI_REFERENCE_REPORT.md](E:\NimaTechVibeCoding\NimaPosApiGravity\reports\v154_ui_audit\V154_UI_REFERENCE_REPORT.md)
- [UI_PAGE_CATALOG.md](E:\NimaTechVibeCoding\NimaPosApiGravity\reports\v154_ui_audit\UI_PAGE_CATALOG.md)
- [UI_SHELL_GUIDELINES.md](E:\NimaTechVibeCoding\NimaPosApiGravity\reports\v154_ui_audit\UI_SHELL_GUIDELINES.md)
- [UI_PAGE_PATTERNS.md](E:\NimaTechVibeCoding\NimaPosApiGravity\reports\v154_ui_audit\UI_PAGE_PATTERNS.md)
- [UI_MODULE_BLUEPRINTS.md](E:\NimaTechVibeCoding\NimaPosApiGravity\reports\v154_ui_audit\UI_MODULE_BLUEPRINTS.md)

## Core Principles

### 1. One shell, many products

Do not redesign the app shell for every new Nima app.

Use one shared shell with:

- left grouped sidebar
- top operational header
- main content outlet
- role-aware visibility
- mode-aware module gating

### 2. Product generation starts from blueprint, not from all modules

Every new app should begin from a blueprint:

- Starter POS
- Standard Retail
- Service Business
- Restaurant/Hospitality
- Multi-Branch Retail
- Enterprise Commerce
- Accounting-Enabled Commerce
- CRM-Heavy Sales

Then expand intentionally.

### 3. Page composition must be patterned

Most business screens should follow one of a few standard page types:

- dashboard
- CRUD list page
- analytics/report page
- financial workspace
- operations board
- profile/detail page
- utility tool page

### 4. Business language over technical language

Group and label pages by business meaning:

- Sales
- Customers
- Products
- Supply
- Finance
- HR
- Admin

Not by low-level engineering structure.

## Official Shell Standard

### Sidebar

Must include:

- brand block
- app mode badge
- grouped nav sections
- active state
- user summary area

Should support:

- collapse per section
- permission filtering
- business-type filtering
- mode filtering
- hidden-page filtering

### Header

Should include:

- date or current context
- notification center
- quick status chips
- theme toggle

Optional:

- current branch
- current shift
- environment/mode label

## Official Product Modes

### `starter`

Use for:

- small retail
- fast go-live
- minimal operations

Default modules:

- dashboard
- pos
- orders
- products
- categories
- customers
- reports
- settings

### `standard`

Use for:

- normal store operations
- inventory and purchasing
- loyalty/promotions

### `service`

Use for:

- appointments
- rentals
- maintenance
- recurring services
- project-like work

### `enterprise`

Use for:

- advanced accounting
- HR
- BI
- governance
- approvals
- portals
- advanced inventory/logistics

## Official Navigation Taxonomy

Recommended top-level groups:

1. Main Operation
2. Sales
3. Customers
4. Products
5. Inventory & Supply
6. Projects
7. Logistics
8. Finance & HR
9. Accounting
10. Admin & System

## Official Screen Priorities

### Always high-priority in most apps

- dashboard
- pos or order capture
- products
- customers
- orders
- reports
- settings

### Common but optional

- suppliers
- purchases
- returns
- shifts
- inventory count
- barcode printing
- loyalty
- promotions

### Advanced / enterprise

- accounting suite
- budgeting
- BI dashboards
- audit logs
- compliance
- legal
- HR suite
- advanced WMS
- portals

## Standard Page Recipes

### Dashboard recipe

- hero/context band
- KPI grid
- chart row
- operational alerts
- recent activity
- quick actions

### CRUD recipe

- page header
- summary cards if useful
- toolbar
- filters
- table/grid/list
- create/edit modal
- detail modal if needed

### Financial workspace recipe

- title header
- summary strip
- precise filters
- dense table
- action modal(s)
- export/print

### Operations board recipe

- workflow header
- counters
- status columns/queues
- item cards
- detail modal

## Reusable UI Parts To Standardize

These should become shared Nima interface building blocks:

- `PageHeader`
- `StatsRow`
- `FiltersBar`
- `ActionToolbar`
- `DataTable`
- `EntityGrid`
- `EntityModal`
- `DetailsModal`
- `TrendChart`
- `KPIGrid`
- `StatusBadge`
- `EmptyState`
- `SectionCard`

## Design Direction

### Visual language

- premium business UI
- dark sidebar, bright workspace
- rounded surfaces
- icon-rich navigation
- subtle gradients and glow
- strong information density without clutter

### Avoid

- generic flat admin template look
- exposing too many modules at once
- inconsistent modal and table patterns
- rebuilding shell per project

## Governance Rule

For every future app, define these first:

1. app mode
2. business type
3. enabled modules
4. roles
5. hidden pages

If these are defined, the shell, navigation, and screen inventory should be derived from them.

## Reference Workflow

When designing a new app:

1. Read this file first
2. Choose the blueprint in [UI_MODULE_BLUEPRINTS.md](E:\NimaTechVibeCoding\NimaPosApiGravity\reports\v154_ui_audit\UI_MODULE_BLUEPRINTS.md)
3. Choose screens from [UI_PAGE_CATALOG.md](E:\NimaTechVibeCoding\NimaPosApiGravity\reports\v154_ui_audit\UI_PAGE_CATALOG.md)
4. Build pages using [UI_PAGE_PATTERNS.md](E:\NimaTechVibeCoding\NimaPosApiGravity\reports\v154_ui_audit\UI_PAGE_PATTERNS.md)
5. Keep shell behavior aligned with [UI_SHELL_GUIDELINES.md](E:\NimaTechVibeCoding\NimaPosApiGravity\reports\v154_ui_audit\UI_SHELL_GUIDELINES.md)

## Final Standard

`nima-pos v1.54` is now the strongest UI reference input, but the official reusable standard is this distilled master reference, not the raw archive alone.
