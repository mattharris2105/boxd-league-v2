-- Lets a commissioner set an image for their own league (shown on the league
-- picker/discover cards). Plain URL, same pattern as profiles.avatar_url.
alter table leagues add column if not exists image_url text;
