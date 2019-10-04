Testing DB - mysql running on localhost

```
CREATE DATABASE testusers;
USE testusers;
CREATE USER 'testuser'@'localhost' IDENTIFIED BY 'testpassword';
GRANT ALL PRIVILEGES ON testusers.* TO 'testuser'@'localhost';

DROP TABLE users;CREATE TABLE `users` (`id` VARCHAR(64) NOT NULL,`name` VARCHAR(128),`username` VARCHAR(128) NOT NULL,`email` VARCHAR(128) NOT NULL,`password` VARCHAR(128) NOT NULL,`community` CHAR(1),`validated` CHAR(1),`created` VARCHAR(19),`stripeCustomer` VARCHAR(128),`stripeSubscription` VARCHAR(128),`stripeStatus` VARCHAR(128),`ignoredPosters` TEXT,`threadState` TEXT,`oldContributorId` VARCHAR(128),`pendingEmail` VARCHAR(128) NOT NULL,PRIMARY KEY (`id`),UNIQUE KEY `username` (`username`),UNIQUE KEY `email` (`email`),UNIQUE KEY `pendingEmail` (`pendingEmail`)) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE tokens;CREATE TABLE `tokens` (`id` VARCHAR(64) NOT NULL,`userId` VARCHAR(64) NOT NULL,`token` VARCHAR(64) NOT NULL,`ttl` int NOT NULL,`created` VARCHAR(19),`lastaccess` VARCHAR(19),PRIMARY KEY (`id`),UNIQUE KEY `token` (`token`)) ENGINE=InnoDB DEFAULT CHARSET=utf8;

```
