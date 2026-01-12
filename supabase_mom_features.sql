-- ============================================
-- FAMILYCARE PORTAL - MOM FEATURES UPDATE
-- פיצ'רים מיוחדים לאמא 👓
-- ============================================

-- ============================================
-- GALLERY PHOTOS - תמונות גלריה
-- ============================================

CREATE TABLE IF NOT EXISTS gallery_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    caption TEXT,
    caption_en TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    uploaded_by UUID REFERENCES family_members(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gallery_family ON gallery_photos(family_id, is_active);

ALTER TABLE gallery_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view gallery" ON gallery_photos
    FOR SELECT USING (family_id = get_user_family_id());

CREATE POLICY "Editors can manage gallery" ON gallery_photos
    FOR ALL USING (family_id = get_user_family_id() AND get_user_role() IN ('admin', 'editor'));

-- ============================================
-- TUTORIAL CATEGORIES - קטגוריות הדרכה
-- ============================================

CREATE TABLE IF NOT EXISTS tutorial_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    name_en TEXT,
    icon TEXT DEFAULT '📺',
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tutorial_categories_family ON tutorial_categories(family_id);

ALTER TABLE tutorial_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tutorial categories" ON tutorial_categories
    FOR SELECT USING (family_id = get_user_family_id());

CREATE POLICY "Admins can manage tutorial categories" ON tutorial_categories
    FOR ALL USING (family_id = get_user_family_id() AND is_admin());

-- ============================================
-- TUTORIALS - הדרכות
-- ============================================

CREATE TABLE IF NOT EXISTS tutorials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    category_id UUID REFERENCES tutorial_categories(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    title_en TEXT,
    description TEXT,
    content_type TEXT DEFAULT 'images', -- 'video', 'images', 'text'
    video_url TEXT,                      -- YouTube/Vimeo URL
    steps JSONB,                         -- [{step: 1, image_url: '', text: ''}]
    is_active BOOLEAN DEFAULT TRUE,
    view_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES family_members(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tutorials_family ON tutorials(family_id);
CREATE INDEX idx_tutorials_category ON tutorials(category_id);

ALTER TABLE tutorials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tutorials" ON tutorials
    FOR SELECT USING (family_id = get_user_family_id());

CREATE POLICY "Editors can manage tutorials" ON tutorials
    FOR ALL USING (family_id = get_user_family_id() AND get_user_role() IN ('admin', 'editor'));

-- ============================================
-- MOM DISPLAY CONTROL - שליטה מרחוק
-- ============================================

CREATE TABLE IF NOT EXISTS mom_display_control (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID REFERENCES families(id) ON DELETE CASCADE UNIQUE,
    current_view TEXT DEFAULT 'dashboard', -- 'dashboard', 'tutorial', 'message', 'screensaver', 'photo'
    content_id UUID,                        -- ID of tutorial/message/photo to show
    content_data JSONB,                     -- Additional data if needed
    triggered_by UUID REFERENCES family_members(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE mom_display_control ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view display control" ON mom_display_control
    FOR SELECT USING (family_id = get_user_family_id());

CREATE POLICY "Editors can manage display control" ON mom_display_control
    FOR ALL USING (family_id = get_user_family_id() AND get_user_role() IN ('admin', 'editor'));

-- Function to update display (with realtime trigger)
CREATE OR REPLACE FUNCTION update_mom_display(
    p_family_id UUID,
    p_view TEXT,
    p_content_id UUID DEFAULT NULL,
    p_content_data JSONB DEFAULT NULL,
    p_triggered_by UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO mom_display_control (family_id, current_view, content_id, content_data, triggered_by, updated_at)
    VALUES (p_family_id, p_view, p_content_id, p_content_data, p_triggered_by, NOW())
    ON CONFLICT (family_id) DO UPDATE SET
        current_view = p_view,
        content_id = p_content_id,
        content_data = p_content_data,
        triggered_by = p_triggered_by,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- MOM MESSAGES - הודעות לאמא
-- ============================================

CREATE TABLE IF NOT EXISTS mom_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    from_member_id UUID REFERENCES family_members(id),
    message TEXT NOT NULL,
    is_urgent BOOLEAN DEFAULT FALSE,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mom_messages_family ON mom_messages(family_id, is_read);
CREATE INDEX idx_mom_messages_created ON mom_messages(created_at DESC);

ALTER TABLE mom_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view mom messages" ON mom_messages
    FOR SELECT USING (family_id = get_user_family_id());

CREATE POLICY "Editors can create mom messages" ON mom_messages
    FOR INSERT WITH CHECK (family_id = get_user_family_id() AND get_user_role() IN ('admin', 'editor'));

CREATE POLICY "Mom can mark as read" ON mom_messages
    FOR UPDATE USING (family_id = get_user_family_id());

-- ============================================
-- MOM SETTINGS - הגדרות תצוגה לאמא
-- ============================================

CREATE TABLE IF NOT EXISTS mom_display_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID REFERENCES families(id) ON DELETE CASCADE UNIQUE,
    screensaver_timeout INTEGER DEFAULT 300,     -- seconds (5 minutes)
    photo_interval INTEGER DEFAULT 30,           -- seconds between photos
    night_mode_start TIME DEFAULT '22:00',
    night_mode_end TIME DEFAULT '07:00',
    show_weather BOOLEAN DEFAULT TRUE,
    weather_location TEXT DEFAULT 'Ramat HaSharon, IL',
    font_size TEXT DEFAULT 'large',              -- 'normal', 'large', 'xlarge'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE mom_display_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view mom settings" ON mom_display_settings
    FOR SELECT USING (family_id = get_user_family_id());

CREATE POLICY "Admins can manage mom settings" ON mom_display_settings
    FOR ALL USING (family_id = get_user_family_id() AND is_admin());

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER update_tutorials_updated_at
    BEFORE UPDATE ON tutorials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_mom_display_settings_updated_at
    BEFORE UPDATE ON mom_display_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- SEED DATA - משפחת סיינפלד
-- ============================================

-- Initialize mom display control
INSERT INTO mom_display_control (family_id, current_view)
VALUES ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'dashboard')
ON CONFLICT (family_id) DO NOTHING;

-- Initialize mom settings
INSERT INTO mom_display_settings (family_id, weather_location)
VALUES ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'Ramat HaSharon, IL')
ON CONFLICT (family_id) DO NOTHING;

-- Tutorial categories
INSERT INTO tutorial_categories (family_id, name, name_en, icon, display_order) VALUES
('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'טלוויזיה ו-YES', 'TV & YES', '📺', 1),
('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'טלפון ווואטסאפ', 'Phone & WhatsApp', '📱', 2),
('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'מכשירי בית', 'Home Appliances', '🏠', 3),
('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'בריאות', 'Health', '💊', 4)
ON CONFLICT DO NOTHING;

-- ============================================
-- ENABLE REALTIME
-- ============================================

-- Enable realtime for mom display control (for instant updates)
ALTER PUBLICATION supabase_realtime ADD TABLE mom_display_control;
ALTER PUBLICATION supabase_realtime ADD TABLE mom_messages;

-- ============================================
-- DONE!
-- ============================================
