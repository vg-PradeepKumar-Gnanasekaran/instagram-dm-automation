-- Instagram DM Automation Database Schema
-- Run this in Supabase SQL Editor

-- Create enums
CREATE TYPE "TransactionType" AS ENUM ('PURCHASE', 'USAGE', 'REFUND', 'BONUS', 'ADMIN_ADJUSTMENT');
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');
CREATE TYPE "TargetType" AS ENUM ('ALL_POSTS', 'SPECIFIC_POSTS', 'HASHTAG_POSTS', 'RECENT_POSTS');
CREATE TYPE "KeywordLogic" AS ENUM ('OR', 'AND');
CREATE TYPE "ScheduleType" AS ENUM ('IMMEDIATE', 'SCHEDULED', 'RECURRING');
CREATE TYPE "DmStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'RATE_LIMITED', 'BLOCKED');
CREATE TYPE "LogLevel" AS ENUM ('DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL');

-- User table
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "emailVerified" TIMESTAMP(3),
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerifyToken" TEXT,
    "resetPasswordToken" TEXT,
    "resetPasswordExpires" TIMESTAMP(3),
    "instagramUserId" TEXT,
    "instagramUsername" TEXT,
    "instagramToken" TEXT,
    "instagramTokenExpiry" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSuspended" BOOLEAN NOT NULL DEFAULT false,
    "suspensionReason" TEXT,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "lowCreditThreshold" INTEGER NOT NULL DEFAULT 20,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- Credit table
CREATE TABLE "Credit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Credit_pkey" PRIMARY KEY ("id")
);

-- Transaction table
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "price" DOUBLE PRECISION,
    "stripeSessionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- AutomationRule table
CREATE TABLE "AutomationRule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "targetType" "TargetType" NOT NULL DEFAULT 'ALL_POSTS',
    "targetPostUrls" TEXT[],
    "targetHashtags" TEXT[],
    "targetDateRange" TEXT,
    "keywords" TEXT[],
    "keywordLogic" "KeywordLogic" NOT NULL DEFAULT 'OR',
    "caseSensitive" BOOLEAN NOT NULL DEFAULT false,
    "excludeKeywords" TEXT[],
    "mustBeFollower" BOOLEAN NOT NULL DEFAULT true,
    "cooldownHours" INTEGER NOT NULL DEFAULT 24,
    "minAccountAgeDays" INTEGER,
    "requirePublicAccount" BOOLEAN NOT NULL DEFAULT false,
    "minCommentLength" INTEGER,
    "maxCommentLength" INTEGER,
    "messageTemplateId" TEXT,
    "scheduleType" "ScheduleType" NOT NULL DEFAULT 'IMMEDIATE',
    "scheduledStartAt" TIMESTAMP(3),
    "scheduledEndAt" TIMESTAMP(3),
    "maxDmsPerDay" INTEGER NOT NULL DEFAULT 50,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "totalTriggered" INTEGER NOT NULL DEFAULT 0,
    "totalSent" INTEGER NOT NULL DEFAULT 0,
    "totalFailed" INTEGER NOT NULL DEFAULT 0,
    "lastTriggeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AutomationRule_pkey" PRIMARY KEY ("id")
);

-- MessageTemplate table
CREATE TABLE "MessageTemplate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "variant" TEXT,
    "timesSent" INTEGER NOT NULL DEFAULT 0,
    "responseRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MessageTemplate_pkey" PRIMARY KEY ("id")
);

-- DmLog table
CREATE TABLE "DmLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "automationRuleId" TEXT,
    "messageTemplateId" TEXT,
    "recipientUsername" TEXT NOT NULL,
    "recipientUserId" TEXT NOT NULL,
    "messageContent" TEXT NOT NULL,
    "triggerComment" TEXT,
    "postUrl" TEXT,
    "status" "DmStatus" NOT NULL DEFAULT 'PENDING',
    "failureReason" TEXT,
    "creditsUsed" INTEGER NOT NULL DEFAULT 1,
    "sentAt" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DmLog_pkey" PRIMARY KEY ("id")
);

-- AnalyticsDaily table
CREATE TABLE "AnalyticsDaily" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "dmsSent" INTEGER NOT NULL DEFAULT 0,
    "dmsFailed" INTEGER NOT NULL DEFAULT 0,
    "creditsUsed" INTEGER NOT NULL DEFAULT 0,
    "creditsPurchased" INTEGER NOT NULL DEFAULT 0,
    "successRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "activeRules" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AnalyticsDaily_pkey" PRIMARY KEY ("id")
);

-- RateLimitTracker table
CREATE TABLE "RateLimitTracker" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recipientUserId" TEXT NOT NULL,
    "lastContactedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contactCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RateLimitTracker_pkey" PRIMARY KEY ("id")
);

-- SystemLog table
CREATE TABLE "SystemLog" (
    "id" TEXT NOT NULL,
    "level" "LogLevel" NOT NULL DEFAULT 'INFO',
    "category" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SystemLog_pkey" PRIMARY KEY ("id")
);

-- Create unique constraints
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_emailVerifyToken_key" ON "User"("emailVerifyToken");
CREATE UNIQUE INDEX "User_resetPasswordToken_key" ON "User"("resetPasswordToken");
CREATE UNIQUE INDEX "User_instagramUserId_key" ON "User"("instagramUserId");
CREATE UNIQUE INDEX "Transaction_stripeSessionId_key" ON "Transaction"("stripeSessionId");
CREATE UNIQUE INDEX "Transaction_stripePaymentIntentId_key" ON "Transaction"("stripePaymentIntentId");
CREATE UNIQUE INDEX "AnalyticsDaily_userId_date_key" ON "AnalyticsDaily"("userId", "date");
CREATE UNIQUE INDEX "RateLimitTracker_userId_recipientUserId_key" ON "RateLimitTracker"("userId", "recipientUserId");

-- Create indexes
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_instagramUserId_idx" ON "User"("instagramUserId");
CREATE INDEX "Credit_userId_idx" ON "Credit"("userId");
CREATE INDEX "Transaction_userId_idx" ON "Transaction"("userId");
CREATE INDEX "Transaction_stripeSessionId_idx" ON "Transaction"("stripeSessionId");
CREATE INDEX "Transaction_createdAt_idx" ON "Transaction"("createdAt");
CREATE INDEX "AutomationRule_userId_idx" ON "AutomationRule"("userId");
CREATE INDEX "AutomationRule_isActive_idx" ON "AutomationRule"("isActive");
CREATE INDEX "AutomationRule_userId_isActive_idx" ON "AutomationRule"("userId", "isActive");
CREATE INDEX "MessageTemplate_userId_idx" ON "MessageTemplate"("userId");
CREATE INDEX "DmLog_userId_idx" ON "DmLog"("userId");
CREATE INDEX "DmLog_automationRuleId_idx" ON "DmLog"("automationRuleId");
CREATE INDEX "DmLog_recipientUserId_idx" ON "DmLog"("recipientUserId");
CREATE INDEX "DmLog_createdAt_idx" ON "DmLog"("createdAt");
CREATE INDEX "DmLog_userId_createdAt_idx" ON "DmLog"("userId", "createdAt");
CREATE INDEX "AnalyticsDaily_userId_date_idx" ON "AnalyticsDaily"("userId", "date");
CREATE INDEX "RateLimitTracker_userId_idx" ON "RateLimitTracker"("userId");
CREATE INDEX "RateLimitTracker_lastContactedAt_idx" ON "RateLimitTracker"("lastContactedAt");
CREATE INDEX "SystemLog_level_idx" ON "SystemLog"("level");
CREATE INDEX "SystemLog_category_idx" ON "SystemLog"("category");
CREATE INDEX "SystemLog_createdAt_idx" ON "SystemLog"("createdAt");
CREATE INDEX "SystemLog_userId_idx" ON "SystemLog"("userId");

-- Add foreign key constraints
ALTER TABLE "Credit" ADD CONSTRAINT "Credit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AutomationRule" ADD CONSTRAINT "AutomationRule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AutomationRule" ADD CONSTRAINT "AutomationRule_messageTemplateId_fkey" FOREIGN KEY ("messageTemplateId") REFERENCES "MessageTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MessageTemplate" ADD CONSTRAINT "MessageTemplate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DmLog" ADD CONSTRAINT "DmLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DmLog" ADD CONSTRAINT "DmLog_automationRuleId_fkey" FOREIGN KEY ("automationRuleId") REFERENCES "AutomationRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DmLog" ADD CONSTRAINT "DmLog_messageTemplateId_fkey" FOREIGN KEY ("messageTemplateId") REFERENCES "MessageTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AnalyticsDaily" ADD CONSTRAINT "AnalyticsDaily_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
