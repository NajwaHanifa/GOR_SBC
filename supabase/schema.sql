-- ====================================================================
-- GOR SBC PINGPONG - SUPABASE POSTGRESQL SCHEMA & MIGRATION SCRIPT
-- Website & Sistem Booking Fasilitas Meja Pingpong GOR SBC Jagakarsa
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
DO $$ BEGIN
    CREATE TYPE booking_type_enum AS ENUM ('regular', 'tournament');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE booking_status_enum AS ENUM (
        'awaiting_payment',
        'awaiting_verification',
        'confirmed',
        'rejected',
        'expired',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status_enum AS ENUM (
        'unpaid',
        'proof_submitted',
        'paid',
        'rejected'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    phone VARCHAR(30) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. USER ROLES (Separate from profiles to prevent client-side privilege escalation)
CREATE TABLE IF NOT EXISTS public.user_roles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABLES (MEJA PINGPONG 1 & 2)
CREATE TABLE IF NOT EXISTS public.tables (
    id SERIAL PRIMARY KEY,
    table_number INT UNIQUE NOT NULL CHECK (table_number IN (1, 2)),
    table_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    maintenance_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Meja 1 and Meja 2
INSERT INTO public.tables (table_number, table_name, is_active)
VALUES 
    (1, 'Meja Pingpong 1 (Standar Turnamen)', true),
    (2, 'Meja Pingpong 2 (Standar Turnamen)', true)
ON CONFLICT (table_number) DO UPDATE SET table_name = EXCLUDED.table_name;

-- 6. BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_code VARCHAR(20) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    booking_type booking_type_enum NOT NULL DEFAULT 'regular',
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_hours INT NOT NULL CHECK (duration_hours >= 1),
    total_price NUMERIC(12, 2) NOT NULL CHECK (total_price >= 0),
    booking_status booking_status_enum NOT NULL DEFAULT 'awaiting_payment',
    payment_status payment_status_enum NOT NULL DEFAULT 'unpaid',
    payment_deadline TIMESTAMPTZ NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_date ON public.bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON public.bookings(payment_status);

-- 7. BOOKING TABLES JUNCTION
CREATE TABLE IF NOT EXISTS public.booking_tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    table_id INT NOT NULL REFERENCES public.tables(id) ON DELETE CASCADE,
    UNIQUE (booking_id, table_id)
);

CREATE INDEX IF NOT EXISTS idx_booking_tables_rel ON public.booking_tables(booking_id, table_id);

-- 8. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID UNIQUE NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    proof_url TEXT,
    verification_status VARCHAR(30) NOT NULL DEFAULT 'unpaid' CHECK (verification_status IN ('unpaid', 'proof_submitted', 'paid', 'rejected')),
    verified_by UUID REFERENCES auth.users(id),
    verified_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. GALLERY PHOTOS
CREATE TABLE IF NOT EXISTS public.gallery_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    image_url TEXT NOT NULL,
    caption TEXT,
    display_order INT NOT NULL DEFAULT 0,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. SYSTEM SETTINGS
CREATE TABLE IF NOT EXISTS public.settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default settings
INSERT INTO public.settings (setting_key, setting_value)
VALUES 
    ('general', '{
        "gor_name": "GOR SBC (Gelanggang Olahraga SBC)",
        "address": "Jl. Brigif No.55, RT.1/RW.1, Cipedak, Kec. Jagakarsa, Kota Jakarta Selatan, Daerah Khusus Ibukota Jakarta 12630",
        "phone": "0812-9876-5432",
        "bca_account_number": "7310293841",
        "bca_account_holder": "PENGELOLA GOR SBC",
        "price_regular_per_hour": 50000,
        "price_tournament": 1500000,
        "payment_timeout_minutes": 30
    }'::jsonb),
    ('operating_hours', '{
        "monday": {"open": "08:00", "close": "16:00", "isOpen": true},
        "tuesday": {"open": "12:00", "close": "16:00", "isOpen": true},
        "wednesday": {"open": "12:00", "close": "16:00", "isOpen": true},
        "thursday": {"open": "08:00", "close": "16:00", "isOpen": true},
        "friday": {"open": "08:00", "close": "16:00", "isOpen": true},
        "saturday": {"open": "12:00", "close": "16:00", "isOpen": true},
        "sunday": {"open": "12:00", "close": "16:00", "isOpen": true}
    }'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles policies
CREATE POLICY "Public profiles can be viewed by anyone" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can edit own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- User roles policies
CREATE POLICY "Admins can view all roles" ON public.user_roles
    FOR SELECT USING (public.is_admin() OR auth.uid() = user_id);

CREATE POLICY "Only admins can modify roles" ON public.user_roles
    FOR ALL USING (public.is_admin());

-- Tables policies (Anyone can read, only admin can edit)
CREATE POLICY "Public tables view" ON public.tables
    FOR SELECT USING (true);

CREATE POLICY "Admin tables edit" ON public.tables
    FOR ALL USING (public.is_admin());

-- Bookings policies
CREATE POLICY "Users can view own bookings or public slot times" ON public.bookings
    FOR SELECT USING (
        auth.uid() = user_id 
        OR public.is_admin()
        OR true -- Public calendar slot availability requires reading start/end/table
    );

CREATE POLICY "Authenticated users can create bookings" ON public.bookings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own booking notes or cancel" ON public.bookings
    FOR UPDATE USING (
        (auth.uid() = user_id AND booking_status = 'awaiting_payment') 
        OR public.is_admin()
    );

-- Booking tables policies
CREATE POLICY "Public view booking tables" ON public.booking_tables
    FOR SELECT USING (true);

CREATE POLICY "Insert booking tables" ON public.booking_tables
    FOR INSERT WITH CHECK (true);

-- Payments policies
CREATE POLICY "Users can view own payments, Admins can view all" ON public.payments
    FOR SELECT USING (
        public.is_admin() 
        OR EXISTS (
            SELECT 1 FROM public.bookings b 
            WHERE b.id = booking_id AND b.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert payment for own booking" ON public.payments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.bookings b 
            WHERE b.id = booking_id AND b.user_id = auth.uid()
        )
    );

CREATE POLICY "Only Admin can verify and update payments" ON public.payments
    FOR UPDATE USING (public.is_admin());

-- Gallery policies
CREATE POLICY "Anyone can view gallery" ON public.gallery_photos
    FOR SELECT USING (true);

CREATE POLICY "Only admin can manage gallery" ON public.gallery_photos
    FOR ALL USING (public.is_admin());

-- Settings policies
CREATE POLICY "Anyone can view settings" ON public.settings
    FOR SELECT USING (true);

CREATE POLICY "Only admin can update settings" ON public.settings
    FOR ALL USING (public.is_admin());

-- ====================================================================
-- ATOMIC BOOKING FUNCTION (ANTI-DOUBLE BOOKING TRANSACTION RPC)
-- ====================================================================
CREATE OR REPLACE FUNCTION public.create_booking_atomic(
    p_user_id UUID,
    p_booking_type booking_type_enum,
    p_booking_date DATE,
    p_start_time TIME,
    p_end_time TIME,
    p_duration_hours INT,
    p_tables INT[],
    p_total_price NUMERIC,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_booking_id UUID;
    v_booking_code VARCHAR(20);
    v_conflict_count INT;
    v_deadline TIMESTAMPTZ;
    v_table_id INT;
BEGIN
    -- 1. Acquire transaction advisory lock for the target date to ensure strict serializability
    PERFORM pg_advisory_xact_lock(hashtext(p_booking_date::text));

    -- 2. Check for active schedule conflict
    SELECT COUNT(*)
    INTO v_conflict_count
    FROM public.bookings b
    JOIN public.booking_tables bt ON b.id = bt.booking_id
    WHERE b.booking_date = p_booking_date
      AND b.booking_status IN ('awaiting_payment', 'awaiting_verification', 'confirmed')
      AND (
          (p_booking_type = 'tournament')
          OR (b.booking_type = 'tournament')
          OR (bt.table_id = ANY(p_tables))
      )
      AND (
          b.start_time < p_end_time AND b.end_time > p_start_time
      );

    IF v_conflict_count > 0 THEN
        RAISE EXCEPTION 'Jadwal bertabrakan: Meja yang dipilih sudah terisi pada rentang jam tersebut.';
    END IF;

    -- 3. Generate unique booking code: SBC-YYYYMMDD-XXXX
    v_booking_code := 'SBC-' || to_char(p_booking_date, 'YYYYMMDD') || '-' || upper(substring(md5(random()::text), 1, 4));
    v_deadline := NOW() + INTERVAL '30 minutes';

    -- 4. Insert booking header
    INSERT INTO public.bookings (
        booking_code,
        user_id,
        booking_type,
        booking_date,
        start_time,
        end_time,
        duration_hours,
        total_price,
        booking_status,
        payment_status,
        payment_deadline,
        notes
    ) VALUES (
        v_booking_code,
        p_user_id,
        p_booking_type,
        p_booking_date,
        p_start_time,
        p_end_time,
        p_duration_hours,
        p_total_price,
        'awaiting_payment',
        'unpaid',
        v_deadline,
        p_notes
    ) RETURNING id INTO v_booking_id;

    -- 5. Link tables
    FOREACH v_table_id IN ARRAY p_tables
    LOOP
        INSERT INTO public.booking_tables (booking_id, table_id)
        VALUES (v_booking_id, v_table_id);
    END LOOP;

    -- 6. Insert initial payments row
    INSERT INTO public.payments (
        booking_id,
        amount,
        verification_status
    ) VALUES (
        v_booking_id,
        p_total_price,
        'unpaid'
    );

    RETURN jsonb_build_object(
        'success', true,
        'booking_id', v_booking_id,
        'booking_code', v_booking_code,
        'payment_deadline', v_deadline
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
