# Plan: Fix Supabase Storage RLS Policy for Image Upload

## Goal
Fix "new row violates row-level security policy" when uploading images to the property-images bucket.

## Root Cause
Supabase Storage has Row Level Security (RLS) enabled by default. The `property-images` bucket needs policies that allow:
- Authenticated users (admins) to upload/delete files
- Public read access for serving images

## Changes
- [ ] Add RLS policies to the `property-images` bucket via Supabase API
  - Public SELECT (read) for everyone
  - INSERT/UPDATE/DELETE for authenticated users

## Testing
- Upload an image in admin panel → should succeed

## Notes
- Using service role key to set policies (bypasses RLS)
- The client-side upload uses the anon key, so policies must allow authenticated uploads
