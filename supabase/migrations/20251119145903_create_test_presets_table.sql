/*
  # Create test presets table

  1. New Tables
    - `test_presets`
      - `id` (uuid, primary key) - Unique identifier for each preset
      - `key` (text, unique) - Unique key for the preset (e.g., 'cra_darty', 'crs_fnac')
      - `name` (text) - Display name of the preset
      - `partner_id` (text) - Partner identifier
      - `source_id` (text) - Source identifier
      - `scale_id` (text) - Scale identifier
      - `amount` (text) - Amount value
      - `duration` (text) - Duration value
      - `first_name` (text) - First name
      - `last_name` (text) - Last name
      - `birth_date` (text) - Birth date
      - `email` (text) - Email address
      - `mobile` (text) - Mobile phone number
      - `return_url` (text) - Return URL
      - `exchange_url` (text) - Exchange URL
      - `business_provider_id` (text, nullable) - Business provider ID (optional, for IKEA)
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `test_presets` table
    - Add policy for public read access (anyone can read presets)
    - Add policy for authenticated users to insert/update/delete presets

  3. Initial Data
    - Insert default presets (CRA Darty, CRS FNAC, CRS IKEA)
*/

CREATE TABLE IF NOT EXISTS test_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  name text NOT NULL,
  partner_id text NOT NULL,
  source_id text NOT NULL,
  scale_id text NOT NULL,
  amount text NOT NULL DEFAULT '0',
  duration text NOT NULL DEFAULT '24',
  first_name text NOT NULL DEFAULT 'MO',
  last_name text NOT NULL DEFAULT 'ZAR',
  birth_date text NOT NULL DEFAULT '1993-06-28',
  email text NOT NULL DEFAULT 'mo@zar.fr',
  mobile text NOT NULL DEFAULT '0662662255',
  return_url text NOT NULL DEFAULT 'https://www.darty.com',
  exchange_url text NOT NULL DEFAULT 'https://sofinco.exchange/demo',
  business_provider_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE test_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read test presets"
  ON test_presets FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert test presets"
  ON test_presets FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update test presets"
  ON test_presets FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete test presets"
  ON test_presets FOR DELETE
  TO authenticated
  USING (true);

INSERT INTO test_presets (key, name, partner_id, source_id, scale_id, amount, duration, first_name, last_name, birth_date, email, mobile, return_url, exchange_url, business_provider_id)
VALUES 
  ('cra_darty', 'CRA Darty', 'web_darty', 'cra', 'DLIBR', '70000', '24', 'MO', 'ZAR', '1993-06-28', 'mo@zar.fr', '0662662255', 'https://www.darty.com', 'https://sofinco.exchange/demo', NULL),
  ('crs_fnac', 'CRS FNAC', 'web_fnac', 'crs', 'FLIBR', '100000', '24', 'MO', 'ZAR', '1993-06-28', 'mo@zar.fr', '0662662255', 'https://www.darty.com', 'https://sofinco.exchange/demo', NULL),
  ('crs_ikea', 'CRS IKEA', 'web_ikea', 'crs', 'IK10X49', '100000', '24', 'MO', 'ZAR', '1993-06-28', 'mo@zar.fr', '0662662255', 'https://www.darty.com', 'https://sofinco.exchange/demo', '99102572271')
ON CONFLICT (key) DO NOTHING;
