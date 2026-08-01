-- schema.sql
CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contract_id TEXT NOT NULL,
  clause_type TEXT NOT NULL,
  risk_level TEXT NOT NULL,
  contract_clause_text TEXT,
  matched_standard_text TEXT,
  reason TEXT,
  decision TEXT DEFAULT 'pending',
  reviewer_notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contracts (
  id           TEXT PRIMARY KEY,
  title        TEXT NOT NULL,
  content      TEXT NOT NULL,
  uploaded_by  TEXT,
  created_at   TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contracts_created_at ON contracts(created_at);