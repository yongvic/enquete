CREATE TABLE IF NOT EXISTS "Feedback" (
  "id" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "email" TEXT,
  "rating" INTEGER,
  "page" TEXT,
  "userId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Feedback_createdAt_idx" ON "Feedback"("createdAt");
