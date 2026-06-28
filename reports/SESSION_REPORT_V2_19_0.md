# Session Report: v2.19.0 (Project Costing & WBS)

**Date:** 2026-03-01
**Module:** ERP Expansion: Contracting & Projects
**Status:** ✅ Stable & Verified

## Objective

Implement Phase 19: Allow NimaPOS to operate similarly to a contracting ERP by introducing Project structures, Work Breakdown tasks, and real-time computation of labor/material expenses.

## Technical Implementation

### 1. Schema Expansion

- Deployed four new linked tables under the existing CRM logic mapped directly to `customers(id)`:
  - `projects`: High-level tracking including global `budget` and status.
  - `wbs_tasks`: Sub-groups tracking `estimated_hours` and task-specific budgets.
  - `project_timesheets`: Calculates `hours_worked` * `hourly_rate` explicitly assigned to user IDs.
  - `project_materials`: Directs material costs by querying master product inventory values.

### 2. Logic Layer (`app/repositories/project_repo.py`)

- Created an aggregation controller `get_project_costing_summary()`:
  - Aggregates `SUM(total_cost)` across timesheets and materials.
  - Generates predictive `profit_margin_percentage` fields.
- Developed an atomic consumption route `consume_material()`:
  - Modifies `products.stock_qty`.
  - Pushes an audit trail to `stock_movements`.
  - Binds the monetary deduction to the project capital.

### 3. API Routing (`app/routers/projects.py`)

- Standardized the CRUD operations through comprehensive Pydantic modeling.
- Plugged into `main.py` pushing `API_VERSION = "2.19.0"`.

## Verification

- Executed algorithmic test `test_projects.py`.
- ✅ Confirmed standard calculation: Budget (500k) - Labor (1.5k) - Material (1.5k) = 497k Remaining Capital at 99.4% Profit.
- ✅ Confirmed safe inventory transaction atomicity.

## Next Steps

- Implement **Phase 20: HR Recruitment & Talent Management (v2.20.0)**.
