ALTER TABLE `app_settings` ADD `lead_provider` text DEFAULT 'mock' NOT NULL;--> statement-breakpoint
ALTER TABLE `app_settings` ADD `search_limit` integer DEFAULT 10 NOT NULL;