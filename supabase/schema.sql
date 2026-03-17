-- Schema for Urna Eletrônica

-- Create Tables

CREATE TABLE IF NOT EXISTS classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  number text NOT NULL,
  role text NOT NULL CHECK (role IN ('CLASS_LEADER', 'FIELD_LEADER')),
  photo_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(class_id, number, role)
);

CREATE TABLE IF NOT EXISTS votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  candidate_id uuid REFERENCES candidates(id) ON DELETE SET NULL,
  role text NOT NULL CHECK (role IN ('CLASS_LEADER', 'FIELD_LEADER')),
  vote_type text NOT NULL CHECK (vote_type IN ('VALID', 'BLANK', 'NULL')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Setup RLS (Row Level Security)

ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Policies
-- NOTE: For a production app you should use auth.uid() for admin operations.
-- For this MVP we will allow open access on anon key, or you can use the Service Role key in Admin.

CREATE POLICY "Allow all operations for classes" ON classes FOR ALL USING (true);
CREATE POLICY "Allow all operations for candidates" ON candidates FOR ALL USING (true);
CREATE POLICY "Allow all operations for votes" ON votes FOR ALL USING (true);
