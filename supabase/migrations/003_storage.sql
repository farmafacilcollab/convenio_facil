-- FarmaFácil Convênios — Storage Setup
-- Migration 003: Create private bucket and storage policies

-- Create the private bucket for requisition images
INSERT INTO storage.buckets (id, name, public)
VALUES ('requisitions', 'requisitions', false)
ON CONFLICT (id) DO NOTHING;

-- Store users can upload to their store's folder
CREATE POLICY "storage_upload_store"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'requisitions'
    AND (
      -- Path must start with the user's store slug
      (storage.foldername(name))[1] = (
        SELECT s.slug FROM public.stores s
        INNER JOIN public.profiles p ON p.store_id = s.id
        WHERE p.id = auth.uid()
      )
    )
  );

-- Store users can read objects from their store's folder
CREATE POLICY "storage_read_store"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'requisitions'
    AND (
      (storage.foldername(name))[1] = (
        SELECT s.slug FROM public.stores s
        INNER JOIN public.profiles p ON p.store_id = s.id
        WHERE p.id = auth.uid()
      )
    )
  );

-- Admin can read all objects
CREATE POLICY "storage_read_admin"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'requisitions'
    AND public.get_user_role() = 'admin'
  );

-- Admin can delete objects (for cleanup)
CREATE POLICY "storage_delete_admin"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'requisitions'
    AND public.get_user_role() = 'admin'
  );
