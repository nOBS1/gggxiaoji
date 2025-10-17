-- ==================== OAuth user columns migration ====================
-- Version: 0004
-- Description: Align users/profiles tables with Google OAuth sign-in
-- Date: 2025-10-15

-- Extend users table with OAuth related fields
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS username TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'local',
  ADD COLUMN IF NOT EXISTS google_id TEXT;

-- OAuth users do not have a local password
ALTER TABLE users
  ALTER COLUMN hashed_password DROP NOT NULL;

-- Ensure existing records have a provider value
UPDATE users
SET auth_provider = 'local'
WHERE auth_provider IS NULL;

-- Guarantee unique Google account linkage
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id
  ON users(google_id)
  WHERE google_id IS NOT NULL;

-- Profiles table needs additional fields for OAuth users
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

