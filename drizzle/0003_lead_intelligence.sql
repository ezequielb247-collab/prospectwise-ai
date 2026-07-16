PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_lead_analyses` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL,
  `lead_id` text NOT NULL,
  `campaign_id` text NOT NULL,
  `score` integer NOT NULL,
  `classification` text NOT NULL,
  `priority` text NOT NULL,
  `opportunities` text NOT NULL,
  `recommended_services` text NOT NULL,
  `reasons` text NOT NULL,
  `missing_data` text NOT NULL,
  `rules_version` text NOT NULL,
  `analyzed_at` integer NOT NULL,
  FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`),
  FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`)
);--> statement-breakpoint
DROP TABLE `lead_analyses`;--> statement-breakpoint
ALTER TABLE `__new_lead_analyses` RENAME TO `lead_analyses`;--> statement-breakpoint
CREATE UNIQUE INDEX `lead_analyses_lead_unique` ON `lead_analyses` (`lead_id`);--> statement-breakpoint
CREATE INDEX `lead_analyses_campaign_score_idx` ON `lead_analyses` (`campaign_id`,`score`);--> statement-breakpoint
PRAGMA foreign_keys=ON;
