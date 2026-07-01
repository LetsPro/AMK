-- Private document buckets need read access so authenticated users can create
-- signed URLs for previews and downloads.

DROP POLICY IF EXISTS storage_authenticated_read_private_files ON storage.objects;

CREATE POLICY storage_authenticated_read_private_files
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id IN ('documents', 'receipts'));
