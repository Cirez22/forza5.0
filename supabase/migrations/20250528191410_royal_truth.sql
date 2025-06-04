-- Verify forum_posts table structure
DO $$
BEGIN
    -- Check if forum_posts table exists, if not create it
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'forum_posts') THEN
        CREATE TABLE public.forum_posts (
            id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
            topic_id uuid REFERENCES forum_topics(id) ON DELETE CASCADE,
            user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
            content text,
            view_count integer DEFAULT 0,
            comment_count integer DEFAULT 0,
            created_at timestamptz DEFAULT now(),
            search_text tsvector GENERATED ALWAYS AS (to_tsvector('spanish', content)) STORED
        );

        -- Create indexes
        CREATE INDEX idx_forum_posts_topic_id ON forum_posts(topic_id);
        CREATE INDEX idx_forum_posts_created_at ON forum_posts(created_at DESC);
        CREATE INDEX forum_posts_search_idx ON forum_posts USING gin(search_text);
    END IF;

    -- Recreate the view with proper joins
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
        (
            SELECT COUNT(*)::bigint 
            FROM forum_comments fc 
            WHERE fc.post_id = fp.id
        ) as comment_count
    FROM forum_posts fp
    LEFT JOIN auth.users u ON fp.user_id = u.id
    LEFT JOIN profiles p ON fp.user_id = p.id;

    -- Add RLS policies if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'forum_posts' AND policyname = 'forum_post_read'
    ) THEN
        CREATE POLICY "forum_post_read" ON forum_posts
        FOR SELECT TO public USING (true);
    END IF;
END $$;