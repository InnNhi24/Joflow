-- JOFLOW Database Schema
-- PostgreSQL with PostGIS extension for geospatial features

-- Enable PostGIS extension for location-based queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enable UUID extension for primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    email TEXT,
    role TEXT CHECK (role IN ('giver', 'receiver')),
    location_lat DOUBLE PRECISION NOT NULL,
    location_lng DOUBLE PRECISION NOT NULL,
    location_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Posts table
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('giver', 'receiver')),
    category TEXT NOT NULL CHECK (category IN ('rice', 'water', 'noodles', 'books', 'clothing', 'medicine', 'other')),
    item TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    urgency INTEGER NOT NULL CHECK (urgency >= 1 AND urgency <= 5),
    time_needed TEXT NOT NULL CHECK (time_needed IN ('1hour', '6hours', '24hours', '3days', '1week')),
    notes TEXT,
    location_lat DOUBLE PRECISION NOT NULL,
    location_lng DOUBLE PRECISION NOT NULL,
    location_address TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'confirmed', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Connections table
CREATE TABLE connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    connected_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    giver_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    receiver_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    chat_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure a user can only connect once per post
    UNIQUE(post_id, connected_user_id)
);

-- Messages table for chat functionality
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    connection_id UUID NOT NULL REFERENCES connections(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'location', 'system')),
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_posts_location ON posts USING GIST (ST_Point(location_lng, location_lat));
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_role ON posts(role);
CREATE INDEX idx_posts_category ON posts(category);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);

CREATE INDEX idx_connections_post_id ON connections(post_id);
CREATE INDEX idx_connections_user_id ON connections(connected_user_id);
CREATE INDEX idx_connections_created_at ON connections(created_at DESC);

CREATE INDEX idx_messages_connection_id ON messages(connection_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_location ON users USING GIST (ST_Point(location_lng, location_lat));

-- Functions for automatic updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_connections_updated_at BEFORE UPDATE ON connections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Enable real-time for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Users can read all user profiles but only update their own
CREATE POLICY "Users can view all profiles" ON users
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Posts are publicly readable, users can manage their own
CREATE POLICY "Posts are publicly readable" ON posts
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own posts" ON posts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts" ON posts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts" ON posts
    FOR DELETE USING (auth.uid() = user_id);

-- Connections are visible to post owner and connected user
CREATE POLICY "Users can view relevant connections" ON connections
    FOR SELECT USING (
        auth.uid() = connected_user_id OR 
        auth.uid() IN (SELECT user_id FROM posts WHERE id = post_id)
    );

CREATE POLICY "Users can create connections" ON connections
    FOR INSERT WITH CHECK (auth.uid() = connected_user_id);

CREATE POLICY "Users can update relevant connections" ON connections
    FOR UPDATE USING (
        auth.uid() = connected_user_id OR 
        auth.uid() IN (SELECT user_id FROM posts WHERE id = post_id)
    );

CREATE POLICY "Users can delete own connections" ON connections
    FOR DELETE USING (
        auth.uid() = connected_user_id OR 
        auth.uid() IN (SELECT user_id FROM posts WHERE id = post_id)
    );

-- Messages are visible to connection participants
CREATE POLICY "Users can view connection messages" ON messages
    FOR SELECT USING (
        auth.uid() = sender_id OR
        auth.uid() IN (
            SELECT connected_user_id FROM connections WHERE id = connection_id
            UNION
            SELECT user_id FROM posts p 
            JOIN connections c ON p.id = c.post_id 
            WHERE c.id = connection_id
        )
    );

CREATE POLICY "Users can send messages" ON messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Users can update messages (for marking as read)
CREATE POLICY "Users can update connection messages" ON messages
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT connected_user_id FROM connections WHERE id = connection_id
            UNION
            SELECT user_id FROM posts p 
            JOIN connections c ON p.id = c.post_id 
            WHERE c.id = connection_id
        )
    );

-- Constraint to limit connections per post (max 5)
CREATE OR REPLACE FUNCTION check_connection_limit()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT COUNT(*) FROM connections WHERE post_id = NEW.post_id) >= 5 THEN
        RAISE EXCEPTION 'Maximum 5 connections per post allowed';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_connection_limit
    BEFORE INSERT ON connections
    FOR EACH ROW EXECUTE FUNCTION check_connection_limit();

-- Function to get posts within radius (using PostGIS)
CREATE OR REPLACE FUNCTION get_posts_within_radius(
    center_lat DOUBLE PRECISION,
    center_lng DOUBLE PRECISION,
    radius_km DOUBLE PRECISION DEFAULT 50,
    exclude_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    role TEXT,
    category TEXT,
    item TEXT,
    quantity INTEGER,
    urgency INTEGER,
    time_needed TEXT,
    notes TEXT,
    location_lat DOUBLE PRECISION,
    location_lng DOUBLE PRECISION,
    location_address TEXT,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    distance_km DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.*,
        ST_Distance(
            ST_Point(center_lng, center_lat)::geography,
            ST_Point(p.location_lng, p.location_lat)::geography
        ) / 1000 AS distance_km
    FROM posts p
    WHERE 
        p.status = 'active'
        AND (exclude_user_id IS NULL OR p.user_id != exclude_user_id)
        AND ST_DWithin(
            ST_Point(center_lng, center_lat)::geography,
            ST_Point(p.location_lng, p.location_lat)::geography,
            radius_km * 1000
        )
    ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql;