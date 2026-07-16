CREATE TABLE `app_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`daily_limit` integer DEFAULT 25 NOT NULL,
	`interval_minutes` integer DEFAULT 5 NOT NULL,
	`send_start` text DEFAULT '09:00' NOT NULL,
	`send_end` text DEFAULT '18:00' NOT NULL,
	`manual_approval` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `settings_user_unique` ON `app_settings` (`user_id`);--> statement-breakpoint
CREATE TABLE `campaigns` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`name` text NOT NULL,
	`city` text NOT NULL,
	`state` text NOT NULL,
	`segment` text NOT NULL,
	`company_limit` integer NOT NULL,
	`services` text NOT NULL,
	`daily_limit` integer NOT NULL,
	`send_start` text NOT NULL,
	`send_end` text NOT NULL,
	`status` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `campaigns_user_status_idx` ON `campaigns` (`user_id`,`status`);--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`lead_id` text NOT NULL,
	`status` text NOT NULL,
	`manual_takeover` integer DEFAULT false NOT NULL,
	`last_message_at` integer,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `crm_activities` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`lead_id` text NOT NULL,
	`type` text NOT NULL,
	`note` text,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `lead_analyses` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`lead_id` text NOT NULL,
	`score` integer NOT NULL,
	`summary` text NOT NULL,
	`suggested_services` text NOT NULL,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`campaign_id` text,
	`external_id` text,
	`name` text NOT NULL,
	`phone` text,
	`website` text,
	`address` text,
	`category` text,
	`rating` integer,
	`reviews` integer,
	`maps_url` text,
	`crm_stage` text NOT NULL,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `leads_user_phone_unique` ON `leads` (`user_id`,`phone`);--> statement-breakpoint
CREATE UNIQUE INDEX `leads_user_external_unique` ON `leads` (`user_id`,`external_id`);--> statement-breakpoint
CREATE TABLE `message_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`message_id` text NOT NULL,
	`provider_id` text,
	`status` text NOT NULL,
	`error` text,
	FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`lead_id` text NOT NULL,
	`campaign_id` text,
	`body` text NOT NULL,
	`status` text NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`scheduled_at` integer,
	`approved_at` integer,
	`sent_at` integer,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `messages_queue_idx` ON `messages` (`user_id`,`status`,`scheduled_at`);--> statement-breakpoint
CREATE TABLE `opt_outs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`phone` text NOT NULL,
	`reason` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `opt_outs_user_phone_unique` ON `opt_outs` (`user_id`,`phone`);--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `profiles_email_unique` ON `profiles` (`email`);