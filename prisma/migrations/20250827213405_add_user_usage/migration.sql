-- CreateTable
CREATE TABLE "public"."user_usage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "grammarChecksToday" INTEGER NOT NULL DEFAULT 0,
    "styleSuggestionsToday" INTEGER NOT NULL DEFAULT 0,
    "lastResetDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "planType" TEXT NOT NULL DEFAULT 'free',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_usage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_usage_userId_key" ON "public"."user_usage"("userId");

-- AddForeignKey
ALTER TABLE "public"."user_usage" ADD CONSTRAINT "user_usage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
