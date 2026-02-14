
-- Add unique constraint for upsert on curriculum_lesson_progress
ALTER TABLE public.curriculum_lesson_progress
  ADD CONSTRAINT curriculum_lesson_progress_user_lesson_unique
  UNIQUE (user_id, lesson_id);
