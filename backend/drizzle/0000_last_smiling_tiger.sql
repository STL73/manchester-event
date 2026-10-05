CREATE TYPE "public"."acc_status" AS ENUM('active', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."event_status" AS ENUM('draft', 'pending', 'approved', 'rejected', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'organiser', 'admin');--> statement-breakpoint
CREATE TABLE "categories" (
	"category_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "categories_category_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"slug" varchar(100) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug"),
	CONSTRAINT "categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "category_follows" (
	"user_id" integer NOT NULL,
	"category_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "category_follows_user_id_category_id_pk" PRIMARY KEY("user_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "contact_messages" (
	"message_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "contact_messages_message_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" integer,
	"name" varchar(50) NOT NULL,
	"email" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"read_at" timestamp with time zone,
	"replied_at" timestamp with time zone,
	"replied_by" integer,
	"reply_body" text
);
--> statement-breakpoint
CREATE TABLE "events" (
	"event_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "events_event_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"organiser_id" integer NOT NULL,
	"event_name" varchar(255) NOT NULL,
	"event_description" text NOT NULL,
	"start_datetime" timestamp with time zone NOT NULL,
	"end_datetime" timestamp with time zone,
	"location_id" integer NOT NULL,
	"category_id" integer NOT NULL,
	"ticket_url" varchar(500),
	"image_url" varchar(1000),
	"status" "event_status" DEFAULT 'draft' NOT NULL,
	"rejection_reason" text,
	"approved_snapshot" jsonb,
	"organiser_updated_at" timestamp with time zone,
	"admin_updated_at" timestamp with time zone,
	"admin_updated_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "events_end_after_start" CHECK ("events"."end_datetime" > "events"."start_datetime")
);
--> statement-breakpoint
CREATE TABLE "favourites" (
	"user_id" integer NOT NULL,
	"event_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "favourites_user_id_event_id_pk" PRIMARY KEY("user_id","event_id")
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"location_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "locations_location_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"place_id" varchar(255) NOT NULL,
	"location_name" varchar(255) NOT NULL,
	"address" varchar(255) NOT NULL,
	"latitude" numeric(10, 8) NOT NULL,
	"longitude" numeric(11, 8) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "locations_place_id_unique" UNIQUE("place_id")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"notification_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "notifications_notification_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" integer NOT NULL,
	"event_id" integer,
	"type" varchar(50) NOT NULL,
	"subject" varchar(255) NOT NULL,
	"body" text NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_logs" (
	"log_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "system_logs_log_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" integer,
	"username" varchar(50),
	"role" "role",
	"action" varchar(100) NOT NULL,
	"details" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"user_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_user_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"username" varchar(50) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"role" "role" DEFAULT 'user' NOT NULL,
	"email_verified_at" timestamp with time zone,
	"acc_status" "acc_status" DEFAULT 'active' NOT NULL,
	"suspended_until" timestamp with time zone,
	"suspension_reason" text,
	"email_notifications" boolean DEFAULT true NOT NULL,
	"avatar" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "category_follows" ADD CONSTRAINT "category_follows_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_follows" ADD CONSTRAINT "category_follows_category_id_categories_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("category_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_messages" ADD CONSTRAINT "contact_messages_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_messages" ADD CONSTRAINT "contact_messages_replied_by_users_user_id_fk" FOREIGN KEY ("replied_by") REFERENCES "public"."users"("user_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_organiser_id_users_user_id_fk" FOREIGN KEY ("organiser_id") REFERENCES "public"."users"("user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_location_id_locations_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("location_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_category_id_categories_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("category_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_admin_updated_by_users_user_id_fk" FOREIGN KEY ("admin_updated_by") REFERENCES "public"."users"("user_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favourites" ADD CONSTRAINT "favourites_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favourites" ADD CONSTRAINT "favourites_event_id_events_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("event_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_event_id_events_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("event_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_logs" ADD CONSTRAINT "system_logs_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "category_follows_category_id_idx" ON "category_follows" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "events_organiser_id_idx" ON "events" USING btree ("organiser_id");--> statement-breakpoint
CREATE INDEX "events_category_id_idx" ON "events" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "events_location_id_idx" ON "events" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "events_status_idx" ON "events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "favourites_event_id_idx" ON "favourites" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "notifications_user_id_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "notifications_event_reminder_unique" ON "notifications" USING btree ("user_id","event_id") WHERE type = 'event_reminder';--> statement-breakpoint
CREATE INDEX "system_logs_created_at_idx" ON "system_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "system_logs_user_id_idx" ON "system_logs" USING btree ("user_id");