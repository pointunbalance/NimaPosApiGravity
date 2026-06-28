# Nima Starter Frontend Blueprint

## Goal

This blueprint defines the minimum reusable frontend structure for generating future Nima sales applications from the master UI reference.

It is not tied to one business only. It is the base shell that can be expanded by mode.

## Base Stack Direction

Recommended frontend stack:

- React
- TypeScript
- React Router
- shared layout shell
- module-based pages
- reusable component primitives

## Recommended Folder Structure

```text
frontend/
  src/
    app/
      routes/
      providers/
      shell/
    pages/
      dashboard/
      pos/
      products/
      customers/
      orders/
      reports/
      settings/
    modules/
      inventory/
      purchasing/
      crm/
      accounting/
      hr/
      logistics/
    components/
      layout/
      data-display/
      forms/
      feedback/
      navigation/
    design-system/
      tokens/
      patterns/
      icons/
    lib/
    types/
```

## Base Screens

These should exist in the first reusable starter:

- Dashboard
- POS
- Orders
- Products
- Categories
- Customers
- Reports
- Settings

## Optional Phase 2 Screens

- Returns
- Expenses
- Suppliers
- Purchases
- Shifts
- Inventory Count
- Barcode Printing

## Starter Navigation Groups

- Main
- Sales
- Products
- Customers
- Reports
- Admin

## Starter Shell Contract

### Sidebar

- grouped menu
- active route state
- icon per item
- role-aware filtering

### Header

- page title/context
- date
- notifications
- theme toggle

### Main content

- page header
- content outlet

## Starter Page Contracts

### Dashboard

- KPI cards
- top products
- recent activity
- low stock/alerts

### POS

- product search
- category filtering
- product grid
- cart panel
- finalize sale action

### Orders

- filters
- orders table
- order details modal

### Products

- products table or grid
- add/edit modal
- filters

### Customers

- customers list
- customer form modal
- customer profile/details

### Reports

- report selection
- period filter
- KPI summary

### Settings

- business profile
- feature toggles
- branding
- hidden pages

## Growth Strategy

When a new app needs more than Starter:

### Move to Standard by adding

- suppliers
- purchases
- returns
- shifts
- promotions
- inventory count

### Move to Service by adding

- subscriptions
- tasks
- projects
- bookings/rentals

### Move to Enterprise by adding

- accounting suite
- HR
- BI
- governance
- advanced WMS

## Reusable Component Contract

Each feature should prefer these reusable shells:

- `PageLayout`
- `PageHeader`
- `StatsBar`
- `FiltersBar`
- `ActionToolbar`
- `EntityTable`
- `EntityFormModal`
- `DetailsPanel`

## Design Rules

- keep the shell stable across apps
- vary enabled modules, not the fundamental structure
- keep business screens dense but readable
- do not overload starter apps with enterprise navigation

## Recommended Next Implementation Step

Create a real starter frontend package that contains:

- shell
- route config
- 8 base pages
- shared table/filter/modal components
- feature toggles by app mode

That package should become the practical frontend source for all future Nima app generation.
