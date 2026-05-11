-- Add learning outcomes and features to cohorts
ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS learning_outcomes TEXT[] DEFAULT '{}';
ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS curriculum_highlights TEXT[] DEFAULT '{}';
