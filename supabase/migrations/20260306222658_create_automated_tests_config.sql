-- Create Automated Tests Configuration Table
--
-- 1. New Tables
--    - automated_tests_config
--      - id (uuid, primary key) - Unique identifier for the configuration
--      - name (text, not null) - Name of the automated test configuration
--      - description (text) - Description of what this configuration does
--      - enabled (boolean, default true) - Whether this configuration is active
--      - test_keys (text array) - Array of Xray test keys to include
--      - environment (text) - Target environment (ci, sit, prod)
--      - branch (text, default 'master') - Git branch to run tests on
--      - cron_expression (text) - Cron expression for scheduling (if scheduled)
--      - timezone (text, default 'UTC') - Timezone for cron execution
--      - variables (jsonb) - Additional variables to pass to the pipeline
--      - notify_on_failure (boolean, default true) - Whether to send notifications on failure
--      - notification_emails (text array) - Email addresses to notify
--      - created_at (timestamptz, default now())
--      - updated_at (timestamptz, default now())
--      - created_by (text) - Username who created the configuration
--      - last_run_at (timestamptz) - Timestamp of last execution
--      - last_run_status (text) - Status of last execution (success, failed)
--
-- 2. Security
--    - Enable RLS on automated_tests_config table
--    - Add policy for authenticated users to read all configurations
--    - Add policy for authenticated users to create configurations
--    - Add policy for authenticated users to update configurations
--    - Add policy for authenticated users to delete configurations
--
-- 3. Indexes
--    - Create index on enabled column for faster filtering
--    - Create index on environment column for faster filtering
--    - Create index on created_at column for sorting

CREATE TABLE IF NOT EXISTS automated_tests_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  enabled boolean DEFAULT true,
  test_keys text[] DEFAULT '{}',
  environment text,
  branch text DEFAULT 'master',
  cron_expression text,
  timezone text DEFAULT 'UTC',
  variables jsonb DEFAULT '{}',
  notify_on_failure boolean DEFAULT true,
  notification_emails text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by text,
  last_run_at timestamptz,
  last_run_status text
);

ALTER TABLE automated_tests_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read all automated tests configurations"
  ON automated_tests_config
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create automated tests configurations"
  ON automated_tests_config
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update automated tests configurations"
  ON automated_tests_config
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete automated tests configurations"
  ON automated_tests_config
  FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_automated_tests_config_enabled ON automated_tests_config(enabled);
CREATE INDEX IF NOT EXISTS idx_automated_tests_config_environment ON automated_tests_config(environment);
CREATE INDEX IF NOT EXISTS idx_automated_tests_config_created_at ON automated_tests_config(created_at DESC);