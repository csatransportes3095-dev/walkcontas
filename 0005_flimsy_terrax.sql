CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientName` varchar(255) NOT NULL,
	`clientPhone` varchar(20) NOT NULL,
	`clientCity` varchar(100) NOT NULL,
	`service` varchar(128) NOT NULL,
	`nameOption` varchar(32) NOT NULL,
	`referrerName` varchar(255),
	`referrerPhone` varchar(20),
	`accessCode` varchar(64),
	`couponCode` varchar(64),
	`paymentMethod` enum('pix','stripe') NOT NULL DEFAULT 'pix',
	`paymentStatus` enum('pending','paid','failed') NOT NULL DEFAULT 'pending',
	`originalValue` varchar(32),
	`discountedValue` varchar(32),
	`stripePaymentIntentId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stripePayments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`stripePaymentIntentId` varchar(255) NOT NULL,
	`amount` int NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'BRL',
	`status` enum('pending','succeeded','failed','canceled') NOT NULL DEFAULT 'pending',
	`paymentMethodType` varchar(32),
	`receiptUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stripePayments_id` PRIMARY KEY(`id`),
	CONSTRAINT `stripePayments_stripePaymentIntentId_unique` UNIQUE(`stripePaymentIntentId`)
);
