-- Extend the existing order-item table for season products; no existing data is removed.
ALTER TABLE order_items MODIFY ticket_type_id varchar(64) NULL;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS season_product_id varchar(64) NULL;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS item_kind varchar(16) NOT NULL DEFAULT 'MATCH';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS seller_staff_user_id char(36) NULL;
ALTER TABLE orders ADD INDEX IF NOT EXISTS orders_seller_staff_idx (seller_staff_user_id);
ALTER TABLE season_entitlements ADD COLUMN IF NOT EXISTS unit_number int NULL;
CREATE UNIQUE INDEX IF NOT EXISTS season_entitlements_order_unit_unique ON season_entitlements(order_id, unit_number);
