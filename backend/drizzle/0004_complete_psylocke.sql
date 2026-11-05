DROP INDEX "notifications_event_reminder_unique";--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "email_sent_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "notifications_email_unsent_idx" ON "notifications" USING btree ("created_at") WHERE email_sent_at IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "notifications_event_reminder_unique" ON "notifications" USING btree ("user_id","event_id","type") WHERE type IN ('event_reminder_week', 'event_reminder_day');