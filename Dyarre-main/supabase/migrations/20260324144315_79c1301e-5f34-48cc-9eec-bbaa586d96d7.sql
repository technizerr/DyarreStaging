
-- Locations table (city + zone)
CREATE TABLE public.locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city text NOT NULL,
  zone text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (city, zone)
);
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read locations" ON public.locations FOR SELECT USING (true);
CREATE POLICY "Admins can insert locations" ON public.locations FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update locations" ON public.locations FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete locations" ON public.locations FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Property types table
CREATE TABLE public.property_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.property_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read property_types" ON public.property_types FOR SELECT USING (true);
CREATE POLICY "Admins can insert property_types" ON public.property_types FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update property_types" ON public.property_types FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete property_types" ON public.property_types FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Property statuses table
CREATE TABLE public.property_statuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.property_statuses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read property_statuses" ON public.property_statuses FOR SELECT USING (true);
CREATE POLICY "Admins can insert property_statuses" ON public.property_statuses FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update property_statuses" ON public.property_statuses FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete property_statuses" ON public.property_statuses FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Furnishing options table
CREATE TABLE public.furnishing_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.furnishing_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read furnishing_options" ON public.furnishing_options FOR SELECT USING (true);
CREATE POLICY "Admins can insert furnishing_options" ON public.furnishing_options FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update furnishing_options" ON public.furnishing_options FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete furnishing_options" ON public.furnishing_options FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Properties table
CREATE TABLE public.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  type text NOT NULL,
  price numeric(15,2) NOT NULL DEFAULT 0,
  city text NOT NULL,
  zone text NOT NULL,
  bedrooms int NOT NULL DEFAULT 0,
  bathrooms int NOT NULL DEFAULT 0,
  size int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'For Sale',
  furnishing text NOT NULL DEFAULT 'Unfurnished',
  completion_status text NOT NULL DEFAULT 'Ready',
  whatsapp_number text,
  google_map_url text,
  is_visible boolean NOT NULL DEFAULT true,
  features text[] DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read visible properties" ON public.properties FOR SELECT USING (is_visible = true OR (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin')));
CREATE POLICY "Admins can insert properties" ON public.properties FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update properties" ON public.properties FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete properties" ON public.properties FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Property images table
CREATE TABLE public.property_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read property_images" ON public.property_images FOR SELECT USING (true);
CREATE POLICY "Admins can insert property_images" ON public.property_images FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update property_images" ON public.property_images FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete property_images" ON public.property_images FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Contact submissions table
CREATE TABLE public.contact_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  subject text,
  message text NOT NULL,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit contact" ON public.contact_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can read contacts" ON public.contact_submissions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Site settings table
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admins can insert settings" ON public.site_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update settings" ON public.site_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete settings" ON public.site_settings FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Triggers
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
