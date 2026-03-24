CREATE TABLE `website_usage` (
	`id` text PRIMARY KEY NOT NULL,
	`website_id` text NOT NULL,
	`user_id` text NOT NULL,
	`year` integer NOT NULL,
	`month` integer NOT NULL,
	`event_count` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`website_id`) REFERENCES `websites`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `website_usage_period_uniq` ON `website_usage` (`website_id`,`year`,`month`);