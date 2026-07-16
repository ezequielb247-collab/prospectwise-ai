CREATE TABLE `campaign_events` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`campaign_id` text NOT NULL,
	`lead_id` text,
	`message_id` text,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `campaign_events_timeline_idx` ON `campaign_events` (`campaign_id`,`created_at`);--> statement-breakpoint
INSERT OR IGNORE INTO `campaigns` (`id`,`user_id`,`created_at`,`updated_at`,`name`,`city`,`state`,`segment`,`company_limit`,`services`,`daily_limit`,`send_start`,`send_end`,`status`) VALUES ('campaign-unassigned','demo-user',1784192400,1784192400,'Campanha de legado','Não informado','--','Legado',100,'[]',25,'09:00','18:00','paused');--> statement-breakpoint
INSERT OR IGNORE INTO `campaigns` (`id`,`user_id`,`created_at`,`updated_at`,`name`,`city`,`state`,`segment`,`company_limit`,`services`,`daily_limit`,`send_start`,`send_end`,`status`) VALUES ('campaign-odontologia-campinas','demo-user',1783674000,1784192400,'Clínicas odontológicas','Campinas','SP','Odontologia',100,'["Criação de site","Bot para WhatsApp"]',25,'09:00','18:00','active');--> statement-breakpoint
INSERT OR IGNORE INTO `campaigns` (`id`,`user_id`,`created_at`,`updated_at`,`name`,`city`,`state`,`segment`,`company_limit`,`services`,`daily_limit`,`send_start`,`send_end`,`status`) VALUES ('campaign-servicos-campinas','demo-user',1783765800,1784192400,'Serviços profissionais','Campinas','SP','Serviços',60,'["Agentes de IA","Automações"]',20,'09:00','18:00','active');--> statement-breakpoint
INSERT OR IGNORE INTO `campaigns` (`id`,`user_id`,`created_at`,`updated_at`,`name`,`city`,`state`,`segment`,`company_limit`,`services`,`daily_limit`,`send_start`,`send_end`,`status`) VALUES ('campaign-comercio-local','demo-user',1783861200,1784192400,'Comércio local','Campinas','SP','Comércio',40,'["Landing page","Criação de site"]',15,'09:00','18:00','paused');--> statement-breakpoint
UPDATE `leads` SET `campaign_id`='campaign-unassigned' WHERE `campaign_id` IS NULL;--> statement-breakpoint
UPDATE `messages` SET `campaign_id`=COALESCE((SELECT `campaign_id` FROM `leads` WHERE `leads`.`id`=`messages`.`lead_id`),'campaign-unassigned') WHERE `campaign_id` IS NULL;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_leads` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`campaign_id` text NOT NULL,
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
INSERT INTO `__new_leads`("id", "user_id", "created_at", "updated_at", "campaign_id", "external_id", "name", "phone", "website", "address", "category", "rating", "reviews", "maps_url", "crm_stage") SELECT "id", "user_id", "created_at", "updated_at", "campaign_id", "external_id", "name", "phone", "website", "address", "category", "rating", "reviews", "maps_url", "crm_stage" FROM `leads`;--> statement-breakpoint
DROP TABLE `leads`;--> statement-breakpoint
ALTER TABLE `__new_leads` RENAME TO `leads`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `leads_user_phone_unique` ON `leads` (`user_id`,`phone`);--> statement-breakpoint
CREATE UNIQUE INDEX `leads_user_external_unique` ON `leads` (`user_id`,`external_id`);--> statement-breakpoint
CREATE INDEX `leads_campaign_stage_idx` ON `leads` (`campaign_id`,`crm_stage`);--> statement-breakpoint
CREATE TABLE `__new_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`lead_id` text NOT NULL,
	`campaign_id` text NOT NULL,
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
INSERT INTO `__new_messages`("id", "user_id", "created_at", "updated_at", "lead_id", "campaign_id", "body", "status", "attempts", "scheduled_at", "approved_at", "sent_at") SELECT "id", "user_id", "created_at", "updated_at", "lead_id", "campaign_id", "body", "status", "attempts", "scheduled_at", "approved_at", "sent_at" FROM `messages`;--> statement-breakpoint
DROP TABLE `messages`;--> statement-breakpoint
ALTER TABLE `__new_messages` RENAME TO `messages`;--> statement-breakpoint
CREATE INDEX `messages_queue_idx` ON `messages` (`user_id`,`status`,`scheduled_at`);--> statement-breakpoint
CREATE INDEX `messages_campaign_idx` ON `messages` (`campaign_id`,`status`);--> statement-breakpoint
ALTER TABLE `conversations` ADD `campaign_id` text NOT NULL DEFAULT 'campaign-unassigned' REFERENCES campaigns(id);--> statement-breakpoint
ALTER TABLE `crm_activities` ADD `campaign_id` text NOT NULL DEFAULT 'campaign-unassigned' REFERENCES campaigns(id);--> statement-breakpoint
CREATE INDEX `crm_activity_timeline_idx` ON `crm_activities` (`lead_id`,`created_at`);--> statement-breakpoint
INSERT OR IGNORE INTO `leads` (`id`,`user_id`,`created_at`,`updated_at`,`campaign_id`,`external_id`,`name`,`phone`,`website`,`address`,`category`,`rating`,`reviews`,`maps_url`,`crm_stage`) VALUES ('lead-sorriso-prime','demo-user',1783675080,1784192400,'campaign-odontologia-campinas','seed-sorriso','Sorriso Prime Odontologia','(19) 99542-8170',NULL,'Campinas, SP','Clínica odontológica',48,46,NULL,'Interessado');--> statement-breakpoint
INSERT OR IGNORE INTO `leads` (`id`,`user_id`,`created_at`,`updated_at`,`campaign_id`,`external_id`,`name`,`phone`,`website`,`address`,`category`,`rating`,`reviews`,`maps_url`,`crm_stage`) VALUES ('lead-studio-helena','demo-user',1783767000,1784192400,'campaign-servicos-campinas','seed-helena','Studio Helena Arquitetura','(19) 99182-0406','https://example.invalid','Campinas, SP','Arquitetura',47,31,NULL,'Respondeu');--> statement-breakpoint
INSERT OR IGNORE INTO `leads` (`id`,`user_id`,`created_at`,`updated_at`,`campaign_id`,`external_id`,`name`,`phone`,`website`,`address`,`category`,`rating`,`reviews`,`maps_url`,`crm_stage`) VALUES ('lead-cafe-aurora','demo-user',1783863000,1784192400,'campaign-comercio-local','seed-cafe','Café Aurora','(19) 98813-2711',NULL,'Campinas, SP','Cafeteria',46,28,NULL,'Contatado');--> statement-breakpoint
INSERT OR IGNORE INTO `leads` (`id`,`user_id`,`created_at`,`updated_at`,`campaign_id`,`external_id`,`name`,`phone`,`website`,`address`,`category`,`rating`,`reviews`,`maps_url`,`crm_stage`) VALUES ('lead-vitta-pilates','demo-user',1783767600,1784192400,'campaign-servicos-campinas','seed-vitta','Vitta Pilates','(19) 99701-4228','https://example.invalid','Campinas, SP','Estúdio de pilates',45,19,NULL,'Mensagem preparada');--> statement-breakpoint
INSERT OR IGNORE INTO `leads` (`id`,`user_id`,`created_at`,`updated_at`,`campaign_id`,`external_id`,`name`,`phone`,`website`,`address`,`category`,`rating`,`reviews`,`maps_url`,`crm_stage`) VALUES ('lead-almeida-reis','demo-user',1783768200,1784192400,'campaign-servicos-campinas','seed-almeida','Almeida & Reis Contábil','(19) 98125-9010','https://example.invalid','Campinas, SP','Contabilidade',44,15,NULL,'Novo');--> statement-breakpoint
INSERT OR IGNORE INTO `messages` (`id`,`user_id`,`created_at`,`updated_at`,`lead_id`,`campaign_id`,`body`,`status`,`attempts`,`sent_at`) VALUES ('message-sorriso','demo-user',1784039400,1784039400,'lead-sorriso-prime','campaign-odontologia-campinas','Mensagem de demonstração','Respondida',1,1784039400);--> statement-breakpoint
INSERT OR IGNORE INTO `messages` (`id`,`user_id`,`created_at`,`updated_at`,`lead_id`,`campaign_id`,`body`,`status`,`attempts`,`sent_at`) VALUES ('message-helena','demo-user',1784041800,1784041800,'lead-studio-helena','campaign-servicos-campinas','Mensagem de demonstração','Respondida',1,1784041800);--> statement-breakpoint
INSERT OR IGNORE INTO `messages` (`id`,`user_id`,`created_at`,`updated_at`,`lead_id`,`campaign_id`,`body`,`status`,`attempts`) VALUES ('message-vitta','demo-user',1784106900,1784106900,'lead-vitta-pilates','campaign-servicos-campinas','Mensagem de demonstração','Preparada',0);--> statement-breakpoint
INSERT OR IGNORE INTO `messages` (`id`,`user_id`,`created_at`,`updated_at`,`lead_id`,`campaign_id`,`body`,`status`,`attempts`,`sent_at`) VALUES ('message-cafe','demo-user',1784115600,1784115600,'lead-cafe-aurora','campaign-comercio-local','Mensagem de demonstração','Enviada',1,1784115600);--> statement-breakpoint
INSERT OR IGNORE INTO `campaign_events` (`id`,`user_id`,`created_at`,`updated_at`,`campaign_id`,`lead_id`,`message_id`,`type`,`title`,`description`) VALUES ('event-1','demo-user',1783674000,1783674000,'campaign-odontologia-campinas',NULL,NULL,'campaign_created','Campanha criada','Segmento e limites comerciais definidos.');--> statement-breakpoint
INSERT OR IGNORE INTO `campaign_events` (`id`,`user_id`,`created_at`,`updated_at`,`campaign_id`,`lead_id`,`message_id`,`type`,`title`,`description`) VALUES ('event-2','demo-user',1783675080,1783675080,'campaign-odontologia-campinas','lead-sorriso-prime',NULL,'lead_imported','Empresa importada','Sorriso Prime adicionada à campanha.');--> statement-breakpoint
INSERT OR IGNORE INTO `campaign_events` (`id`,`user_id`,`created_at`,`updated_at`,`campaign_id`,`lead_id`,`message_id`,`type`,`title`,`description`) VALUES ('event-3','demo-user',1784039400,1784039400,'campaign-odontologia-campinas','lead-sorriso-prime','message-sorriso','message_sent','Mensagem enviada','Contato registrado no histórico.');--> statement-breakpoint
INSERT OR IGNORE INTO `campaign_events` (`id`,`user_id`,`created_at`,`updated_at`,`campaign_id`,`lead_id`,`message_id`,`type`,`title`,`description`) VALUES ('event-4','demo-user',1784041320,1784041320,'campaign-odontologia-campinas','lead-sorriso-prime','message-sorriso','reply_received','Resposta recebida','Empresa demonstrou interesse em um site.');
