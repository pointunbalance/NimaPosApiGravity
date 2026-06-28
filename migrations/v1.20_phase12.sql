-- Migration Phase 12: Advanced Master Data & Bulk Operations
-- Version: 1.20.0

-- 1. Brands Table
CREATE TABLE IF NOT EXISTS product_brands (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Origins Table
CREATE TABLE IF NOT EXISTS product_origins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE, -- e.g., 'Local', 'China', 'Germany'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Storage Locations Table
CREATE TABLE IF NOT EXISTS product_locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE, -- e.g., 'Shelf A-1', 'Showcase 2'
    warehouse_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(warehouse_id) REFERENCES warehouses(id)
);

-- 4. Manufacturers Table
CREATE TABLE IF NOT EXISTS product_manufacturers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    website TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. Enhance Products Table
-- Note: SQLite doesn't support adding multiple columns in one ALTER TABLE elegantly in old versions,
-- so we do them one by one for safety.
ALTER TABLE products ADD COLUMN brand_id INTEGER REFERENCES product_brands(id);
ALTER TABLE products ADD COLUMN origin_id INTEGER REFERENCES product_origins(id);
ALTER TABLE products ADD COLUMN location_id INTEGER REFERENCES product_locations(id);
ALTER TABLE products ADD COLUMN manufacturer_id INTEGER REFERENCES product_manufacturers(id);
ALTER TABLE products ADD COLUMN is_important INTEGER DEFAULT 0; -- Flag for priority items
ALTER TABLE products ADD COLUMN is_shortage INTEGER DEFAULT 0; -- Flag for manually marked shortages
ALTER TABLE products ADD COLUMN model_number TEXT; -- e.g., Part number/Model
ALTER TABLE products ADD COLUMN last_purchase_price REAL DEFAULT 0;
ALTER TABLE products ADD COLUMN avg_cost REAL DEFAULT 0;

-- 6. Insert Default Data
INSERT OR IGNORE INTO product_origins (name) VALUES ('Local'), ('Imported');
INSERT OR IGNORE INTO product_brands (name) VALUES ('GENERIC');
