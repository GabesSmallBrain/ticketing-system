-- A season purchase is represented by a relational season order item and numbered units.
ALTER TABLE season_entitlements ADD COLUMN IF NOT EXISTS order_item_id char(36) NULL;
ALTER TABLE season_entitlements ADD INDEX IF NOT EXISTS season_entitlements_order_item_idx (order_item_id);
CREATE UNIQUE INDEX IF NOT EXISTS season_entitlements_order_item_unit_unique ON season_entitlements(order_item_id, unit_number);
ALTER TABLE order_items ADD INDEX IF NOT EXISTS order_items_season_product_idx (season_product_id);
