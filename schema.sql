-- schema.sql
CREATE TABLE reviews (
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
