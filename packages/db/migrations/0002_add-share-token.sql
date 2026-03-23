ALTER TABLE `websites` ADD `share_token` text;--> statement-breakpoint
CREATE UNIQUE INDEX `websites_share_token_unique` ON `websites` (`share_token`);