/*
  # Add Jira ticket URL to test failure analyses

  1. Changes
    - Add `jira_ticket_url` column to `test_failure_analyses` table
    - Column is optional (nullable) to support existing records
    - Type is text to store URLs
  
  2. Notes
    - This column will be required when root_cause is 'Bug applicatif', 'Bug test auto', or 'Évolution code(tests auto à mettre à jour)'
    - Validation will be handled at application level
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'test_failure_analyses' AND column_name = 'jira_ticket_url'
  ) THEN
    ALTER TABLE test_failure_analyses ADD COLUMN jira_ticket_url text;
  END IF;
END $$;