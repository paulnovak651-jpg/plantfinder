import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'plantfinder.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

export function initializeDb() {
  const db = getDb();

  db.exec(`
    -- Plants table
    CREATE TABLE IF NOT EXISTS plants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      botanical_name TEXT NOT NULL,
      common_name TEXT NOT NULL,
      common_aliases TEXT DEFAULT '[]',
      plant_group TEXT NOT NULL,
      edible INTEGER DEFAULT 0,
      zone_min REAL,
      zone_max REAL,
      sun TEXT DEFAULT '[]',
      soil_moisture TEXT DEFAULT '[]',
      soil_notes TEXT,
      use_tags TEXT DEFAULT '[]',
      pollination_notes TEXT,
      chill_hours_min INTEGER,
      chill_hours_max INTEGER,
      disease_notes TEXT,
      growth_rate TEXT,
      mature_height_ft REAL,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Cultivars table
    CREATE TABLE IF NOT EXISTS cultivars (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plant_id INTEGER NOT NULL REFERENCES plants(id),
      cultivar_name TEXT NOT NULL,
      aliases TEXT DEFAULT '[]',
      self_fertile INTEGER,
      pollination_group TEXT,
      ripening_window TEXT,
      disease_resistance TEXT DEFAULT '[]',
      zone_min_override REAL,
      zone_max_override REAL,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Rootstocks table
    CREATE TABLE IF NOT EXISTS rootstocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      species TEXT,
      aliases TEXT DEFAULT '[]',
      compatible_with TEXT DEFAULT '[]',
      vigor_class TEXT DEFAULT 'unknown',
      zone_min REAL,
      zone_max REAL,
      soil_tolerance_notes TEXT,
      disease_resistance TEXT DEFAULT '[]',
      anchorage_notes TEXT,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Suppliers table
    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      website_url TEXT,
      contact_email TEXT,
      city TEXT,
      state TEXT NOT NULL,
      postal_code TEXT,
      lat REAL,
      lng REAL,
      retail_enabled INTEGER DEFAULT 1,
      wholesale_enabled INTEGER DEFAULT 0,
      pickup_available INTEGER DEFAULT 0,
      shipping_states TEXT,
      restricted_states TEXT DEFAULT '[]',
      supplier_status TEXT DEFAULT 'active',
      bio TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Supplier listings (the money table)
    CREATE TABLE IF NOT EXISTS supplier_listings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
      listing_type TEXT NOT NULL,
      plant_id INTEGER REFERENCES plants(id),
      cultivar_id INTEGER REFERENCES cultivars(id),
      rootstock_id INTEGER REFERENCES rootstocks(id),
      supplier_raw_name TEXT NOT NULL,
      normalized_title TEXT,
      size_raw TEXT,
      price_amount REAL,
      availability_status TEXT DEFAULT 'unknown',
      qty_bucket TEXT,
      seasonal_window_start TEXT,
      seasonal_window_end TEXT,
      ships_now INTEGER,
      pickup_only INTEGER DEFAULT 0,
      ship_notes TEXT,
      listing_notes TEXT,
      listing_url TEXT,
      inventory_source TEXT DEFAULT 'manual',
      last_inventory_update TEXT,
      confidence_score REAL DEFAULT 0.5,
      confidence_band TEXT DEFAULT 'medium',
      is_visible INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- User searches (demand intelligence)
    CREATE TABLE IF NOT EXISTS user_searches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      raw_query TEXT NOT NULL,
      parsed_filters TEXT,
      user_zip TEXT,
      user_zone TEXT,
      user_state TEXT,
      result_count INTEGER,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Availability alerts
    CREATE TABLE IF NOT EXISTS availability_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      raw_query TEXT,
      target_plant_id INTEGER REFERENCES plants(id),
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Zip zones lookup
    CREATE TABLE IF NOT EXISTS zip_zones (
      zip_code TEXT PRIMARY KEY,
      zone TEXT NOT NULL,
      zone_number REAL,
      lat REAL,
      lng REAL,
      city TEXT,
      state TEXT
    );
  `);

  return db;
}
