UPDATE "Survey" SET status = 'PUBLISHED', "publishedAt" = COALESCE("publishedAt", "createdAt") WHERE code IS NOT NULL;
