CREATE TABLE `accountModels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`description` text,
	`icon` varchar(255),
	`order` int DEFAULT 0,
	`active` int DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `accountModels_id` PRIMARY KEY(`id`),
	CONSTRAINT `accountModels_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `nameOptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`modelId` int NOT NULL,
	`type` enum('random','first','full') NOT NULL,
	`label` varchar(255) NOT NULL,
	`price` int NOT NULL,
	`active` int DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `nameOptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pageCards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`image` text,
	`video` text,
	`link` varchar(255),
	`order` int DEFAULT 0,
	`active` int DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pageCards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `paymentMethods` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` varchar(255) NOT NULL,
	`description` text,
	`pixKey` text,
	`pixKeyHolder` varchar(255),
	`pixBank` varchar(255),
	`active` int DEFAULT 1,
	`order` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `paymentMethods_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `requiredDocuments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`modelId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` varchar(255) NOT NULL,
	`required` int DEFAULT 1,
	`acceptedFormats` varchar(255),
	`order` int DEFAULT 0,
	`active` int DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `requiredDocuments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `siteSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(255) NOT NULL,
	`value` text,
	`type` enum('text','number','boolean','json') DEFAULT 'text',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `siteSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `siteSettings_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `warranties` (
	`id` int AUTO_INCREMENT NOT NULL,
	`modelId` int NOT NULL,
	`rides` int DEFAULT 25,
	`days` int DEFAULT 7,
	`description` text,
	`active` int DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `warranties_id` PRIMARY KEY(`id`)
);
