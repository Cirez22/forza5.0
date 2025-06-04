-- Add categories table
CREATE TABLE forum_categories (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now()
);

-- Add category_id to forum_topics
ALTER TABLE forum_topics 
ADD COLUMN category_id uuid REFERENCES forum_categories(id);

-- Add indexes for better performance
CREATE INDEX idx_forum_posts_topic_id ON forum_posts(topic_id);
CREATE INDEX idx_forum_comments_post_id ON forum_comments(post_id);
CREATE INDEX idx_forum_topics_category_id ON forum_topics(category_id);
CREATE INDEX idx_forum_topics_created_at ON forum_topics(created_at DESC);
CREATE INDEX idx_forum_posts_created_at ON forum_posts(created_at DESC);

-- Add full text search capabilities
ALTER TABLE forum_topics ADD COLUMN search_text tsvector 
    GENERATED ALWAYS AS (to_tsvector('spanish', title)) STORED;
ALTER TABLE forum_posts ADD COLUMN search_text tsvector 
    GENERATED ALWAYS AS (to_tsvector('spanish', content)) STORED;

CREATE INDEX forum_topics_search_idx ON forum_topics USING GIN (search_text);
CREATE INDEX forum_posts_search_idx ON forum_posts USING GIN (search_text);

-- Insert some default categories
INSERT INTO forum_categories (name, description) VALUES
    ('General', 'Discusiones generales sobre construcción y proyectos'),
    ('Técnico', 'Preguntas y debates técnicos'),
    ('Normativas', 'Información sobre regulaciones y normativas'),
    ('Materiales', 'Discusiones sobre materiales de construcción'),
    ('Herramientas', 'Debates sobre herramientas y equipamiento');