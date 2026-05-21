ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS served_at timestamptz;

UPDATE public.orders
SET served_at = COALESCE(served_at, updated_at, created_at)
WHERE status = 'served' AND served_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_orders_served_daily
  ON public.orders (served_at DESC)
  WHERE status = 'served';