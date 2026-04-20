-- ══════════════════════════════════════════════════════════════
-- CLASS SCHEDULES TABLE
-- Run in Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS class_schedules (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  adviser_id   uuid        NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  subject_name text        NOT NULL,
  day_of_week  text        NOT NULL
                           CHECK (day_of_week IN (
                             'Monday','Tuesday','Wednesday',
                             'Thursday','Friday','Saturday','Sunday'
                           )),
  start_time   time        NOT NULL,
  end_time     time        NOT NULL,
  room         text,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE class_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all class_schedules" ON class_schedules;
CREATE POLICY "Allow all class_schedules" ON class_schedules
  FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_class_schedules_adviser
  ON class_schedules(adviser_id);

-- Verify
SELECT 'class_schedules table created successfully' AS status;
