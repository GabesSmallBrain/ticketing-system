CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS clubs (id text PRIMARY KEY, name text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS venues (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), club_id text NOT NULL REFERENCES clubs(id), name text NOT NULL, address text, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS staff_users (id uuid PRIMARY KEY, club_id text NOT NULL REFERENCES clubs(id), email text NOT NULL, password_hash text NOT NULL, display_name text NOT NULL, role text NOT NULL CHECK (role IN ('club_admin','box_office','gate_staff')), active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL, last_login_at timestamptz, UNIQUE (club_id, email));
CREATE TABLE IF NOT EXISTS sessions (id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES staff_users(id), token_hash text NOT NULL UNIQUE, expires_at timestamptz NOT NULL, revoked_at timestamptz, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS events (id text PRIMARY KEY, club_id text NOT NULL REFERENCES clubs(id), venue_id uuid REFERENCES venues(id), slug text NOT NULL, opponent text NOT NULL, competition text NOT NULL, kickoff timestamptz NOT NULL, sales_start timestamptz NOT NULL, sales_end timestamptz NOT NULL, sales_open boolean NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (club_id, slug));
CREATE TABLE IF NOT EXISTS ticket_types (id text PRIMARY KEY, event_id text NOT NULL REFERENCES events(id), club_id text NOT NULL REFERENCES clubs(id), section text NOT NULL, name text NOT NULL, price_cents integer NOT NULL CHECK (price_cents >= 0), capacity integer NOT NULL CHECK (capacity >= 0), sold integer NOT NULL DEFAULT 0 CHECK (sold >= 0 AND sold <= capacity), active boolean NOT NULL DEFAULT true);
CREATE TABLE IF NOT EXISTS orders (id uuid PRIMARY KEY, club_id text NOT NULL REFERENCES clubs(id), event_id text NOT NULL REFERENCES events(id), reference text NOT NULL UNIQUE, channel text NOT NULL, status text NOT NULL, amount_cents integer NOT NULL CHECK (amount_cents >= 0), customer_email text, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS order_items (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_id uuid NOT NULL REFERENCES orders(id), ticket_type_id text NOT NULL REFERENCES ticket_types(id), quantity integer NOT NULL CHECK (quantity > 0), price_cents integer NOT NULL CHECK (price_cents >= 0));
CREATE TABLE IF NOT EXISTS payments (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_id uuid NOT NULL REFERENCES orders(id), provider text NOT NULL, provider_payment_id text NOT NULL, status text NOT NULL, webhook_event_id text UNIQUE, raw_event jsonb, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(provider, provider_payment_id));
CREATE TABLE IF NOT EXISTS tickets (id uuid PRIMARY KEY, club_id text NOT NULL REFERENCES clubs(id), event_id text NOT NULL REFERENCES events(id), order_id uuid NOT NULL REFERENCES orders(id), ticket_type_id text NOT NULL REFERENCES ticket_types(id), reference text NOT NULL UNIQUE, credential_hash text NOT NULL UNIQUE, status text NOT NULL CHECK (status IN ('VALID','CANCELLED')), issued_at timestamptz NOT NULL);
CREATE TABLE IF NOT EXISTS admissions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), ticket_id uuid NOT NULL REFERENCES tickets(id), event_id text NOT NULL REFERENCES events(id), gate text NOT NULL, scanned_at timestamptz NOT NULL DEFAULT now(), UNIQUE(ticket_id));
CREATE TABLE IF NOT EXISTS audit_events (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), club_id text NOT NULL REFERENCES clubs(id), actor_user_id uuid REFERENCES staff_users(id), type text NOT NULL, detail text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS events_club_idx ON events(club_id);
CREATE INDEX IF NOT EXISTS tickets_club_idx ON tickets(club_id);
CREATE INDEX IF NOT EXISTS admissions_event_idx ON admissions(event_id);

-- Production lifecycle extensions. Amounts are always integer cents; provider
-- payloads are retained only for reconciliation and must never contain PAN/CVV.
CREATE TABLE IF NOT EXISTS club_settings (
  club_id text PRIMARY KEY REFERENCES clubs(id) ON DELETE CASCADE,
  timezone text NOT NULL DEFAULT 'Europe/Ljubljana',
  currency char(3) NOT NULL DEFAULT 'EUR',
  public_name text,
  public_email text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id text NOT NULL REFERENCES clubs(id),
  venue_id uuid REFERENCES venues(id),
  name text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (club_id, venue_id, name)
);

CREATE TABLE IF NOT EXISTS scanner_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id text NOT NULL REFERENCES clubs(id),
  gate_id uuid REFERENCES gates(id),
  label text NOT NULL,
  device_token_hash text NOT NULL UNIQUE,
  active boolean NOT NULL DEFAULT true,
  last_seen_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inventory_holds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id text NOT NULL REFERENCES clubs(id),
  event_id text NOT NULL REFERENCES events(id),
  ticket_type_id text NOT NULL REFERENCES ticket_types(id),
  cart_key_hash text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  expires_at timestamptz NOT NULL,
  released_at timestamptz,
  converted_order_id uuid REFERENCES orders(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (expires_at > created_at)
);

CREATE TABLE IF NOT EXISTS payment_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  provider_event_id text NOT NULL,
  signature_verified boolean NOT NULL DEFAULT false,
  payload jsonb NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  processing_error text,
  UNIQUE (provider, provider_event_id)
);

CREATE TABLE IF NOT EXISTS refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id text NOT NULL REFERENCES clubs(id),
  order_id uuid NOT NULL REFERENCES orders(id),
  payment_id uuid REFERENCES payments(id),
  provider_refund_id text,
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  status text NOT NULL CHECK (status IN ('PENDING','SUCCEEDED','FAILED','CANCELLED')),
  reason text,
  requested_by uuid REFERENCES staff_users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE (provider_refund_id)
);

CREATE TABLE IF NOT EXISTS ticket_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('EMAIL','PRINT','WALLET_LINK')),
  destination_hash text,
  status text NOT NULL CHECK (status IN ('PENDING','SENT','FAILED')),
  provider_message_id text,
  attempted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admission_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id text NOT NULL REFERENCES clubs(id),
  event_id text REFERENCES events(id),
  ticket_id uuid REFERENCES tickets(id),
  gate_id uuid REFERENCES gates(id),
  scanner_device_id uuid REFERENCES scanner_devices(id),
  actor_user_id uuid REFERENCES staff_users(id),
  credential_fingerprint text,
  result text NOT NULL CHECK (result IN ('accepted','already_used','invalid','wrong_event','cancelled','network_error')),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS idempotency_keys (
  key text PRIMARY KEY,
  club_id text NOT NULL REFERENCES clubs(id),
  scope text NOT NULL,
  request_hash text NOT NULL,
  response_status integer,
  response_body jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  CHECK (expires_at > created_at)
);

CREATE TABLE IF NOT EXISTS outbox_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id text NOT NULL REFERENCES clubs(id),
  aggregate_type text NOT NULL,
  aggregate_id text NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  last_error text
);

CREATE TABLE IF NOT EXISTS staff_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id text NOT NULL REFERENCES clubs(id),
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('club_admin','box_office','gate_staff')),
  token_hash text NOT NULL UNIQUE,
  invited_by uuid REFERENCES staff_users(id),
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sessions_active_user_idx ON sessions(user_id, expires_at) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS ticket_types_event_active_idx ON ticket_types(event_id) WHERE active;
CREATE INDEX IF NOT EXISTS orders_club_event_status_idx ON orders(club_id, event_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS order_items_order_idx ON order_items(order_id);
CREATE INDEX IF NOT EXISTS payments_order_idx ON payments(order_id, status);
CREATE INDEX IF NOT EXISTS tickets_event_status_idx ON tickets(event_id, status);
CREATE INDEX IF NOT EXISTS inventory_holds_active_idx ON inventory_holds(ticket_type_id, expires_at) WHERE released_at IS NULL AND converted_order_id IS NULL;
CREATE INDEX IF NOT EXISTS refunds_order_idx ON refunds(order_id, status);
CREATE INDEX IF NOT EXISTS deliveries_ticket_idx ON ticket_deliveries(ticket_id, created_at DESC);
CREATE INDEX IF NOT EXISTS admission_attempts_event_idx ON admission_attempts(club_id, event_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS admission_attempts_ticket_idx ON admission_attempts(ticket_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS audit_events_club_created_idx ON audit_events(club_id, created_at DESC);
CREATE INDEX IF NOT EXISTS outbox_unpublished_idx ON outbox_events(occurred_at) WHERE published_at IS NULL;
CREATE INDEX IF NOT EXISTS idempotency_expiry_idx ON idempotency_keys(expires_at);

-- Exactly one successful single-entry admission per ticket is already enforced
-- by admissions(ticket_id). Redeem with INSERT ... ON CONFLICT inside one DB
-- transaction and log every result in admission_attempts.
