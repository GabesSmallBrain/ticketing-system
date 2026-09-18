CREATE TABLE IF NOT EXISTS schema_migrations (name varchar(255) PRIMARY KEY, applied_at datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6));

ALTER TABLE events ADD COLUMN IF NOT EXISTS venue_name varchar(180) NOT NULL DEFAULT '';
ALTER TABLE events ADD COLUMN IF NOT EXISTS demo tinyint(1) NOT NULL DEFAULT 0;
ALTER TABLE events ADD COLUMN IF NOT EXISTS base_sold int NOT NULL DEFAULT 0;
ALTER TABLE events ADD COLUMN IF NOT EXISTS base_scanned int NOT NULL DEFAULT 0;
ALTER TABLE events ADD COLUMN IF NOT EXISTS base_revenue_cents int NOT NULL DEFAULT 0;

ALTER TABLE orders MODIFY event_id varchar(64) NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS kind varchar(16) NOT NULL DEFAULT 'MATCH';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS season_product_id varchar(64) NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS season_quantity int NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_first_name varchar(120) NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_last_name varchar(120) NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone varchar(80) NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS access_token_hash varchar(255) NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_secret_hash varchar(255) NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS provider_transaction varchar(255) NULL;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS credential varchar(255) NULL;

CREATE TABLE IF NOT EXISTS season_products (
  id varchar(64) PRIMARY KEY, club_id varchar(64) NOT NULL, name varchar(180) NOT NULL,
  season varchar(32) NOT NULL, price_cents int NOT NULL, active tinyint(1) NOT NULL DEFAULT 1,
  CONSTRAINT fk_season_products_club FOREIGN KEY (club_id) REFERENCES clubs(id)
);
CREATE TABLE IF NOT EXISTS season_entitlements (
  id char(36) PRIMARY KEY, reference varchar(100) NOT NULL UNIQUE, credential varchar(255) NULL,
  credential_hash varchar(255) NOT NULL UNIQUE, club_id varchar(64) NOT NULL,
  season_product_id varchar(64) NOT NULL, order_id char(36) NOT NULL, status varchar(20) NOT NULL,
  issued_at datetime(6) NOT NULL,
  CONSTRAINT fk_season_entitlements_club FOREIGN KEY (club_id) REFERENCES clubs(id),
  CONSTRAINT fk_season_entitlements_product FOREIGN KEY (season_product_id) REFERENCES season_products(id),
  CONSTRAINT fk_season_entitlements_order FOREIGN KEY (order_id) REFERENCES orders(id)
);
