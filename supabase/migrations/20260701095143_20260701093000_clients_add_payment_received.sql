ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS payment_received numeric(14,2);
