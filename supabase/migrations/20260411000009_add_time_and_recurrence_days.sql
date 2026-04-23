ALTER TABLE orders ADD COLUMN IF NOT EXISTS time_solicitada TIME;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS recurring_days TEXT[]; -- Array of days, e.g., ['MONDAY', 'WEDNESDAY']
