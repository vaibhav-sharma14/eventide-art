
CREATE POLICY "event-media read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'event-media');
CREATE POLICY "event-media anon read" ON storage.objects FOR SELECT TO anon
  USING (bucket_id = 'event-media');
CREATE POLICY "event-media upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'event-media' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "event-media update own" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'event-media' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "event-media delete own" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'event-media' AND (storage.foldername(name))[1] = auth.uid()::text);
