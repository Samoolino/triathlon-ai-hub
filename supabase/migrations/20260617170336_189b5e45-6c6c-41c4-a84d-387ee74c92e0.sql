
CREATE POLICY "auth read social-media" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'social-media');
CREATE POLICY "auth upload social-media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'social-media');
CREATE POLICY "auth update social-media" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'social-media');
