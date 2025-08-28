-- Insert Banana Magic Universe source data
INSERT INTO "Source" (id, name, domain, "apiKey", "createdAt", "updatedAt")
VALUES (
  'banana-magic-universe',
  'Banana Magic Universe',
  'localhost:5173',
  NULL,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  domain = EXCLUDED.domain,
  "updatedAt" = NOW();