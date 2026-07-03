-- ----------------------------------------------------------------------------
-- Tighten the `posters` storage bucket now that admins can upload directly
-- from the browser (admin poster form) instead of only via the dashboard.
-- Run this after 0001_init.sql if you already ran that one.
-- ----------------------------------------------------------------------------
update storage.buckets
set file_size_limit = 10485760, -- 10MB, matches the client-side check
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
where id = 'posters';
