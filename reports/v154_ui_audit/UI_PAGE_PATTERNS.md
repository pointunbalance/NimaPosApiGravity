# UI Page Patterns Derived From v1.54

## Purpose

This document turns the v1.54 reference into reusable page composition patterns for future Nima products.

## Pattern 1: Dashboard

Observed references:

- `DashboardHero`
- `DashboardStats`
- `DashboardCharts`
- `DashboardInsights`
- `DashboardQuickActions`
- `DashboardRecentActivity`
- `DashboardTopProducts`
- `DashboardLowStock`

### Recommended composition

1. Hero / context band
2. KPI cards
3. charts row
4. action shortcuts
5. operational alerts
6. recent activity

### Use for

- home page
- branch dashboard
- manager summary

## Pattern 2: CRUD List Page

Observed across:

- products
- customers
- suppliers
- branches
- employees
- purchases

### Recommended composition

1. `Header`
2. `Stats` or summary chips
3. `Toolbar` or quick actions
4. `Filters`
5. `List/Grid/Table`
6. `Create/Edit Modal`
7. `Details Modal` when needed

### Example structure

- `ProductsHeader`
- `ProductsToolbar`
- `ProductsList`
- `ProductModal`

## Pattern 3: Analytics / Report Page

Observed across:

- accounting reports
- expenses trends
- dashboard analytics

### Recommended composition

1. report header
2. period filters
3. KPI summary
4. chart area
5. tabular breakdown
6. export/print actions

### Use for

- financial reports
- sales performance
- stock movement analysis
- customer analytics

## Pattern 4: Financial Workspace Page

Observed in accounting modules:

- chart of accounts
- journal
- general ledger
- checks
- petty cash
- budgeting
- assets

### Recommended composition

1. title and context header
2. finance KPIs/summary
3. structured filters
4. dense data table/grid
5. action buttons
6. create/view/edit modal stack

### Important UI rules

- keep forms modal-based unless the flow is very complex
- allow detail preview without full navigation jump
- support print/export in report-like pages

## Pattern 5: Operations Board

Observed in:

- fulfillment
- kitchen
- tables
- delivery

### Recommended composition

1. board header
2. status counters
3. column-based workflow or ticket board
4. item cards/tickets
5. detail modal

### Best for

- dispatch
- kitchen production
- order preparation
- service queues

## Pattern 6: Modal-Driven Data Entry

Observed heavily in component names:

- `CustomerFormModal`
- `ExpenseModal`
- `EmployeeModal`
- `AccountModal`
- `BudgetModal`
- `JournalEntryEditModal`

### When to use

- create/edit of single entity
- lightweight detail views
- approval or confirmation flows

### Guidelines

- use the same modal structure across entities
- primary action bottom-right
- destructive actions visually separated
- keep long forms sectioned
- include validation inline

## Pattern 7: Profile / Detail Surface

Observed in:

- `CustomerProfile`
- employee detail screens
- lead profile modal
- budget details modal

### Recommended composition

1. profile header
2. identity block
3. tabs or sections
4. financial/activity summary
5. related records

### Use for

- customer 360
- employee 360
- supplier profile
- project detail

## Pattern 8: Utility Tool Screen

Observed in:

- barcode printer
- sticker printing
- backups
- audit logs

### Recommended composition

1. focused header
2. setup panel or sidebar
3. preview area
4. action toolbar

### Distinguishing trait

This type is tool-centric, not record-centric.

## Pattern 9: Portal / External Experience

Observed in:

- customer portal
- vendor portal
- careers portal
- website

### Guidelines

- keep portal screens simpler than internal admin pages
- reduce visible system complexity
- prioritize tasks and status over dense admin controls

## Pattern 10: Master Enterprise Rule

The dominant v1.54 pattern is:

- shell-level consistency
- page-level specialization

That means future Nima apps should reuse:

- shell
- headers
- cards
- filters
- tables
- modal conventions

But should not force every screen into identical content layouts.

## Recommended Starter Page Recipes

### Products page

- header
- product stats
- toolbar
- filters
- table/grid
- product modal

### Customers page

- header
- customer metrics
- list
- customer profile/details
- payment modal

### Orders page

- header
- order stats
- filters
- orders table
- invoice/order modal

### Expenses page

- header
- KPI cards
- trend chart
- list
- create/edit modal

### Accounting page

- header
- summary bar
- filters
- dense table
- entry modal
- print/export

## Conversion Rule For Future Projects

When generating a new Nima app page:

1. Choose page type first
2. Apply the matching pattern
3. Rename modules to business vocabulary
4. Keep shell and interaction language consistent

This is how the v1.54 archive should become a true reference instead of a one-off snapshot.
