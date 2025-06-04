-- Create tables if they don't exist
DO $$ 
BEGIN
    -- Create forum_categories if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'forum_categories') THEN
        CREATE TABLE forum_categories (
            id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
            name text NOT NULL,
            description text,
            created_at timestamptz DEFAULT now()
        );
    END IF;

    -- Create forum_topics if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'forum_topics') THEN
        CREATE TABLE forum_topics (
            id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
            title text NOT NULL,
            category_id uuid REFERENCES forum_categories(id),
            created_by uuid REFERENCES auth.users(id),
            created_at timestamptz DEFAULT now(),
            search_text tsvector GENERATED ALWAYS AS (to_tsvector('spanish', title)) STORED
        );
    END IF;

    -- Create forum_posts if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'forum_posts') THEN
        CREATE TABLE forum_posts (
            id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
            topic_id uuid REFERENCES forum_topics(id) ON DELETE CASCADE,
            user_id uuid REFERENCES auth.users(id),
            content text NOT NULL,
            view_count integer DEFAULT 0,
            comment_count integer DEFAULT 0,
            created_at timestamptz DEFAULT now(),
            search_text tsvector GENERATED ALWAYS AS (to_tsvector('spanish', content)) STORED
        );
    END IF;

    -- Create forum_comments if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'forum_comments') THEN
        CREATE TABLE forum_comments (
            id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
            post_id uuid REFERENCES forum_posts(id) ON DELETE CASCADE,
            user_id uuid REFERENCES auth.users(id),
            content text NOT NULL,
            created_at timestamptz DEFAULT now()
        );
    END IF;
END $$;

-- Enable RLS if not already enabled
DO $$
BEGIN
    EXECUTE 'ALTER TABLE forum_categories ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE forum_topics ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE forum_comments ENABLE ROW LEVEL SECURITY';
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- Create indexes if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_forum_topics_category_id') THEN
        CREATE INDEX idx_forum_topics_category_id ON forum_topics(category_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_forum_posts_topic_id') THEN
        CREATE INDEX idx_forum_posts_topic_id ON forum_posts(topic_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_forum_comments_post_id') THEN
        CREATE INDEX idx_forum_comments_post_id ON forum_comments(post_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_forum_topics_created_at') THEN
        CREATE INDEX idx_forum_topics_created_at ON forum_topics(created_at DESC);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_forum_posts_created_at') THEN
        CREATE INDEX idx_forum_posts_created_at ON forum_posts(created_at DESC);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'forum_topics_search_idx') THEN
        CREATE INDEX forum_topics_search_idx ON forum_topics USING gin(search_text);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'forum_posts_search_idx') THEN
        CREATE INDEX forum_posts_search_idx ON forum_posts USING gin(search_text);
    END IF;
END $$;

-- Drop existing policies to avoid conflicts
DO $$
BEGIN
    DROP POLICY IF EXISTS "Anyone can view forum categories" ON forum_categories;
    DROP POLICY IF EXISTS "Anyone can view forum topics" ON forum_topics;
    DROP POLICY IF EXISTS "Authenticated users can create topics" ON forum_topics;
    DROP POLICY IF EXISTS "Anyone can view forum posts" ON forum_posts;
    DROP POLICY IF EXISTS "Authenticated users can create posts" ON forum_posts;
    DROP POLICY IF EXISTS "Users can update their own posts" ON forum_posts;
    DROP POLICY IF EXISTS "Users can delete their own posts" ON forum_posts;
    DROP POLICY IF EXISTS "Anyone can view forum comments" ON forum_comments;
    DROP POLICY IF EXISTS "Authenticated users can create comments" ON forum_comments;
    DROP POLICY IF EXISTS "Users can update their own comments" ON forum_comments;
    DROP POLICY IF EXISTS "Users can delete their own comments" ON forum_comments;
END $$;

-- Create RLS policies
CREATE POLICY "Anyone can view forum categories" ON forum_categories FOR SELECT TO authenticated USING (true);

CREATE POLICY "Anyone can view forum topics" ON forum_topics FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create topics" ON forum_topics FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Anyone can view forum posts" ON forum_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create posts" ON forum_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own posts" ON forum_posts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own posts" ON forum_posts FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view forum comments" ON forum_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create comments" ON forum_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own comments" ON forum_comments FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON forum_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Drop existing view if it exists
DROP VIEW IF EXISTS v_forum_posts;

-- Create view with explicit column names
CREATE VIEW v_forum_posts AS
SELECT 
    fp.id,
    fp.topic_id,
    fp.user_id,
    fp.content,
    fp.view_count,
    fp.created_at,
    fp.search_text,
    u.email as user_email,
    p.full_name as user_full_name,
    (
        SELECT COUNT(*)::bigint 
        FROM forum_comments fc 
        WHERE fc.post_id = fp.id
    ) as total_comments
FROM forum_posts fp
LEFT JOIN auth.users u ON fp.user_id = u.id
LEFT JOIN profiles p ON fp.user_id = p.id;

-- Insert default categories if they don't exist
INSERT INTO forum_categories (name, description)
SELECT name, description
FROM (VALUES
    ('Materiales', 'Discusiones sobre materiales de construcción'),
    ('Trabajo', 'Ofertas y búsqueda de trabajo en el sector'),
    ('Arquitectura', 'Debates sobre diseño y arquitectura'),
    ('Normativas', 'Consultas sobre normativas y regulaciones'),
    ('General', 'Temas generales del sector')
) AS v(name, description)
WHERE NOT EXISTS (
    SELECT 1 FROM forum_categories 
    WHERE name = v.name
);

-- Create or replace trigger function
CREATE OR REPLACE FUNCTION update_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE forum_posts
    SET comment_count = comment_count + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS trg_comment_counter ON forum_comments;
CREATE TRIGGER trg_comment_counter
    AFTER INSERT ON forum_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_comment_count();