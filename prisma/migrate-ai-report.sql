CREATE TABLE IF NOT EXISTS "AiReport" (
  "id" TEXT NOT NULL,
  "surveyId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "locale" TEXT NOT NULL DEFAULT 'fr',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AiReport_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AiReport_surveyId_createdAt_idx" ON "AiReport"("surveyId", "createdAt");
CREATE INDEX IF NOT EXISTS "AiReport_userId_createdAt_idx" ON "AiReport"("userId", "createdAt");

DO $$ BEGIN
  ALTER TABLE "AiReport" ADD CONSTRAINT "AiReport_surveyId_fkey"
    FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "AiReport" ADD CONSTRAINT "AiReport_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
