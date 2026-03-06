# Plan: Fix "Bucket not found" Error in Image Upload

## Goal
Fix the Supabase Storage error when uploading property images in admin panel.

## Root Cause
The `image-upload.tsx` component uploads directly to Supabase Storage bucket `property-images`, but the bucket hasn't been created in the Supabase project yet.

## Changes
- [ ] Check `image-upload.tsx` to confirm the bucket name used
- [ ] Create a setup script or SQL migration to create the bucket
- [ ] Document the required Supabase setup

## Testing
- Upload an image in admin → should succeed without "Bucket not found" error

## Notes
- This is a Supabase project configuration issue, not a code bug
- The bucket needs to be created in the Supabase dashboard or via API
