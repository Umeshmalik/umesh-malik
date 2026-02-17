-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "PostCategory" AS ENUM ('JAVASCRIPT', 'TYPESCRIPT', 'FRONTEND');

-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHED', 'FAILED');

-- CreateTable
CREATE TABLE "blog_posts" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" "PostCategory" NOT NULL,
    "status" "PostStatus" NOT NULL DEFAULT 'DRAFT',
    "research_sources" JSONB,
    "scheduled_for" TIMESTAMP(3),
    "published_at" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topic_queue" (
    "id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "category" "PostCategory" NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "topic_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "publish_logs" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "error_message" TEXT,
    "attempted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "publish_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_config" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "blog_posts_slug_key" ON "blog_posts"("slug");

-- CreateIndex
CREATE INDEX "blog_posts_status_idx" ON "blog_posts"("status");

-- CreateIndex
CREATE INDEX "blog_posts_category_idx" ON "blog_posts"("category");

-- CreateIndex
CREATE INDEX "blog_posts_scheduled_for_idx" ON "blog_posts"("scheduled_for");

-- CreateIndex
CREATE INDEX "blog_posts_published_at_idx" ON "blog_posts"("published_at");

-- CreateIndex
CREATE INDEX "blog_posts_created_at_idx" ON "blog_posts"("created_at");

-- CreateIndex
CREATE INDEX "topic_queue_used_priority_idx" ON "topic_queue"("used", "priority");

-- CreateIndex
CREATE INDEX "topic_queue_category_idx" ON "topic_queue"("category");

-- CreateIndex
CREATE INDEX "topic_queue_created_at_idx" ON "topic_queue"("created_at");

-- CreateIndex
CREATE INDEX "publish_logs_post_id_idx" ON "publish_logs"("post_id");

-- CreateIndex
CREATE INDEX "publish_logs_attempted_at_idx" ON "publish_logs"("attempted_at");

-- CreateIndex
CREATE INDEX "publish_logs_success_idx" ON "publish_logs"("success");

-- CreateIndex
CREATE UNIQUE INDEX "system_config_key_key" ON "system_config"("key");

-- AddForeignKey
ALTER TABLE "publish_logs" ADD CONSTRAINT "publish_logs_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "blog_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

