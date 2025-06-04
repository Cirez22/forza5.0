-- Enable RLS on forum tables
ALTER TABLE forum_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_comments ENABLE ROW LEVEL SECURITY;

-- Forum topics policies
CREATE POLICY "Anyone can view forum topics"
ON forum_topics FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create topics"
ON forum_topics FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Forum posts policies
CREATE POLICY "Anyone can view forum posts"
ON forum_posts FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create posts"
ON forum_posts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts"
ON forum_posts FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
ON forum_posts FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Forum comments policies
CREATE POLICY "Anyone can view forum comments"
ON forum_comments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create comments"
ON forum_comments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
ON forum_comments FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
ON forum_comments FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create view for forum post details
CREATE OR REPLACE VIEW v_forum_posts AS
SELECT 
  fp.id,
  fp.topic_id,
  fp.user_id,
  fp.content,
  fp.view_count,
  fp.created_at,
  u.email as user_email,
  p.full_name as user_full_name,
  (SELECT COUNT(*) FROM forum_comments fc WHERE fc.post_id = fp.id) as comment_count
FROM forum_posts fp
LEFT JOIN auth.users u ON fp.user_id = u.id
LEFT JOIN profiles p ON fp.user_id = p.id;