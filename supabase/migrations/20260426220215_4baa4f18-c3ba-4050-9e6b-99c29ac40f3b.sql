-- Shift existing weeks to make room for a new Week 0
UPDATE public.weeks SET order_index = order_index + 1;

-- Insert the new "Liberated Kings Workbook" Week 0
INSERT INTO public.weeks (week_number, title, summary, status, unlock_day_offset, order_index)
VALUES (
  0,
  'Liberated Kings Workbook',
  'Your companion workbook for the journey ahead. Download, print, and use it alongside each week.',
  'published',
  0,
  0
);