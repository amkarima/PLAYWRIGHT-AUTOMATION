/*
# Create bug_reports table (single-tenant, no auth)

1. New Tables
- `bug_reports`
  - `id` (uuid, primary key)
  - `report_type` (text: 'bug' or 'contact' — what kind of message)
  - `subject` (text, not null — short title)
  - `description` (text, not null — detailed message)
  - `page_url` (text, optional — URL where the bug was found)
  - `reporter_name` (text, optional — name of the person reporting)
  - `reporter_email` (text, optional — email for follow-up)
  - `status` (text, default 'open' — open/resolved/closed)
  - `browser_info` (text, optional — user agent / browser)
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on `bug_reports`.
- Allow anon + authenticated to INSERT (anyone can submit a report).
- Allow anon + authenticated to SELECT (so the dashboard can list reports if needed).
- No UPDATE or DELETE from the anon key.

3. Notes
- This is a single-tenant app with no sign-in, so policies use `TO anon, authenticated`.
- Reports are read-only once submitted; status changes would be done via service role.
*/

CREATE TABLE IF NOT EXISTS bug_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type text NOT NULL DEFAULT 'bug' CHECK (report_type IN ('bug', 'contact')),
  subject text NOT NULL,
  description text NOT NULL,
  page_url text,
  reporter_name text,
  reporter_email text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'closed')),
  browser_info text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_bug_reports" ON bug_reports;
CREATE POLICY "anon_insert_bug_reports" ON bug_reports FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_select_bug_reports" ON bug_reports;
CREATE POLICY "anon_select_bug_reports" ON bug_reports FOR SELECT
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_bug_reports_created_at ON bug_reports (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bug_reports_status ON bug_reports (status);
CREATE INDEX IF NOT EXISTS idx_bug_reports_type ON bug_reports (report_type);
