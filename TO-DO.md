# TO-DO List

## Completed
- ✅ Fix Apply page uses DB instead of demo data
- ✅ Unique application numbers (crypto.randomUUID)
- ✅ Email notifications for applications and status updates
- ✅ Admin listing form with amenities selection UI
- ✅ Premium UI redesign (hero, featured properties, testimonials, bento gallery)
- ✅ Hydration error fixes (suppressHydrationWarning)
- ✅ Supabase Storage bucket + RLS policies
- ✅ Image upload functionality
- ✅ Resend email setup — API key configured, EMAIL_FROM env var, provider
  errors surfaced in logs, admin notifications live-verified (delivered).
  Test mode only for now: domain verification deferred, so applicant-facing
  emails stay blocked until a sending domain is verified (steps in
  PLAN-EMAIL.md).
- ✅ User authentication (Supabase Auth: login/register/logout, middleware
  route protection, admin role checks)
- ✅ Password reset + email verification for new users (handled by Supabase
  Auth: /forgot-password, /reset-password, signup confirmation email)
- ✅ Rate limiting on API endpoints (inquiries, applications, upload URLs,
  tenant maintenance submissions)
- ✅ Admin dashboard for applications (status, review, approval + status
  update emails)
- ✅ Listings search filters: location + bedrooms
- ✅ Resident portal foundation (leases, lease residents, tenant dashboard)
- ✅ Maintenance requests (tenant submit/cancel, admin queue with server-side
  filters + pagination)
- ✅ CI test pipeline (.github/workflows/ci.yml, vitest) + Docker verification
- ✅ Performance pass (request-scoped auth dedupe, middleware role cache,
  per-page admin guards, pg pool tuning)

## Open Issues

### 🔧 Backend/API
- [ ] Listings page: remaining search filters (price range, amenities)

### 🎨 UI/UX
- [ ] Add a colon (': ') to the hero section (e.g., "Find Your Dream Home:")
- [ ] Add a colon (': ') to the testimonials section (e.g., "What Our Tenants Say:")
- [ ] Add a comma (', ') to the featured properties section (e.g., "Explore Our Listings,")
- [ ] Add a colon (': ') to the pricing section (e.g., "Pricing Details:")
- [ ] Add a comma (', ') to the amenities grid (e.g., "Select Amenities,")

### 📧 Email/Resend
- [ ] Verify a sending domain in Resend + switch EMAIL_FROM to it (unblocks
  applicant-facing emails; steps in PLAN-EMAIL.md)
- [ ] Wire up sendInquiryConfirmation (defined but unused — product decision)

### 📊 Analytics/Features
- [ ] Add analytics (Google Analytics or custom tracking)
- [ ] User profile management (tenant profile/settings page)
- [ ] Add a colon (': ') to the admin dashboard (e.g., "Dashboard Overview:")
- [ ] Add a comma (', ') to the admin applications list (e.g., "Recent Applications,")

### 🔄 Testing
- [ ] Full integration/E2E tests (unit tests exist; no Playwright/E2E yet)
- [ ] Test edge cases (e.g., duplicate application numbers, invalid inputs)
- [ ] Test applicant-facing email notifications once a domain is verified

### 🛠️ Infrastructure
- [ ] Automated deployments (CD; CI already runs tests)
- [ ] Add logging and monitoring

### 📱 Mobile
- [ ] Add responsive design improvements for mobile
- [ ] Test mobile experience thoroughly

### 🔄 Documentation
- [ ] Add comprehensive API documentation
- [ ] Add user guide for admins and tenants

---

## 规则
- 遵循 `CLAUDE.md` 中的 Plan Before Code 规则
- 确保每次改动都经过验证
- 保持文档更新
