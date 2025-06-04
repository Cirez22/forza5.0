-- Create catalog_categories table
CREATE TABLE IF NOT EXISTS catalog_categories (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    description text,
    image_url text,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE catalog_categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can view catalog categories"
    ON catalog_categories FOR SELECT
    TO authenticated
    USING (true);

-- Create catalog_products table if it doesn't exist
CREATE TABLE IF NOT EXISTS catalog_products (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    description text,
    price numeric(12,2) NOT NULL,
    stock integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);

-- Add additional columns to catalog_products
ALTER TABLE catalog_products 
ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES catalog_categories(id),
ADD COLUMN IF NOT EXISTS image_url text;

-- Enable RLS
ALTER TABLE catalog_products ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can view catalog products"
    ON catalog_products FOR SELECT
    TO authenticated
    USING (true);

-- Create shopping_cart table
CREATE TABLE IF NOT EXISTS shopping_cart (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id uuid REFERENCES catalog_products(id) ON DELETE CASCADE,
    quantity integer NOT NULL CHECK (quantity > 0),
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, product_id)
);

-- Enable RLS
ALTER TABLE shopping_cart ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own cart"
    ON shopping_cart FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own cart"
    ON shopping_cart FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Insert sample categories
INSERT INTO catalog_categories (name, description, image_url) VALUES
    ('Herramientas', 'Herramientas profesionales para construcción', 'https://images.pexels.com/photos/162553/keys-workshop-mechanic-tools-162553.jpeg'),
    ('Materiales', 'Materiales de construcción de alta calidad', 'https://images.pexels.com/photos/585418/pexels-photo-585418.jpeg'),
    ('Acabados', 'Acabados y detalles para tu proyecto', 'https://images.pexels.com/photos/713297/pexels-photo-713297.jpeg')
ON CONFLICT DO NOTHING;

-- Insert sample product
DO $$
DECLARE
    category_id uuid;
BEGIN
    SELECT id INTO category_id FROM catalog_categories WHERE name = 'Herramientas' LIMIT 1;
    
    INSERT INTO catalog_products (name, description, price, image_url, stock, category_id) 
    VALUES (
        'Martillo Profesional',
        'Martillo de acero forjado con mango ergonómico',
        29.99,
        'https://images.pexels.com/photos/209235/pexels-photo-209235.jpeg',
        50,
        category_id
    )
    ON CONFLICT DO NOTHING;
END $$;