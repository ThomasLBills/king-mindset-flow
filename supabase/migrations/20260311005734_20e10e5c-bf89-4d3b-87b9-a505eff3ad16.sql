-- Shift existing channels down to make room at sort_order 0
UPDATE chat_channels SET sort_order = sort_order + 1;

-- Insert Liberated Sessions channel
INSERT INTO chat_channels (name, description, created_by, sort_order, is_pinned, is_locked, is_default)
VALUES ('liberated-sessions', 'Weekly Recording.', 'a6e9aaa6-00b8-4a63-a0c5-03fc710f6bb0', 0, true, true, false);
