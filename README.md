# NimaPOS REST API

🛒 A comprehensive, language-agnostic POS (Point of Sale) REST API built with FastAPI.

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Run the server
python run.py
```

Then open **<http://localhost:8000/docs>** for interactive Swagger UI.

## Default Login

- **PIN:** `1234` (owner account)
- **Branch:** `1`

## API Groups (70+ endpoints)

| Group | Prefix | Description |
|-------|--------|-------------|
| Auth | `/api/v1/auth` | Login, Logout, Me |
| Products | `/api/v1/products` | CRUD, Search, Barcode |
| Invoices | `/api/v1/invoices` | Checkout, Void, History |
| Customers | `/api/v1/customers` | CRUD, Purchase History |
| Suppliers | `/api/v1/suppliers` | CRUD |
| Inventory | `/api/v1/inventory` | Stock, Movements |
| Returns | `/api/v1/returns` | Refunds |
| Reports | `/api/v1/reports` | Sales KPIs |
| Dashboard | `/api/v1/dashboard` | Today's KPIs |
| Z-Reports | `/api/v1/z-reports` | Day Close |
| Settings | `/api/v1/settings` | Configuration |
| Users | `/api/v1/users` | User Management |
| Branches | `/api/v1/branches` | Multi-Branch |
| Export | `/api/v1/export` | CSV Downloads |
| Backup | `/api/v1/backup` | DB Backup |
| System | `/api/v1/system` | Health, Version |

## Tech Stack

- **FastAPI** + **Uvicorn**
- **SQLite** (WAL mode)
- **JWT** (PyJWT)
- **Pydantic v2**
