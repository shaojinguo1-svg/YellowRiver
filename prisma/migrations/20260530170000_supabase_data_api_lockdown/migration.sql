-- Lock down direct Supabase Data API access to app-owned public tables.
-- Server-side Prisma access uses the database connection role and is not revoked here.

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.users FROM anon, authenticated;

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.properties FROM anon, authenticated;

ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.property_images FROM anon, authenticated;

ALTER TABLE public.property_amenities ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.property_amenities FROM anon, authenticated;

ALTER TABLE public.amenities ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.amenities FROM anon, authenticated;

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.categories FROM anon, authenticated;

ALTER TABLE public.rental_applications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.rental_applications FROM anon, authenticated;

ALTER TABLE public.application_documents ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.application_documents FROM anon, authenticated;

ALTER TABLE public.application_upload_tokens ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.application_upload_tokens FROM anon, authenticated;

ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.contact_inquiries FROM anon, authenticated;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.site_settings FROM anon, authenticated;

ALTER TABLE public.leases ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.leases FROM anon, authenticated;

ALTER TABLE public.lease_residents ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.lease_residents FROM anon, authenticated;

ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.maintenance_requests FROM anon, authenticated;

ALTER TABLE public._prisma_migrations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public._prisma_migrations FROM anon, authenticated;
