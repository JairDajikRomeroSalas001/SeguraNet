-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `dni` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `loginAttempts` INTEGER NOT NULL DEFAULT 0,
    `lockedUntil` DATETIME(3) NULL,
    `lastLoginAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_username_key`(`username`),
    INDEX `User_role_idx`(`role`),
    INDEX `User_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Case` (
    `id` VARCHAR(191) NOT NULL,
    `caseNumber` VARCHAR(191) NOT NULL,
    `assignedOfficer` VARCHAR(191) NOT NULL,
    `origin` VARCHAR(191) NOT NULL,
    `entryDate` VARCHAR(191) NOT NULL,
    `entryTime` VARCHAR(191) NOT NULL,
    `victimName` VARCHAR(191) NOT NULL,
    `victimDni` VARCHAR(191) NOT NULL,
    `victimPhone` VARCHAR(191) NOT NULL,
    `victimStreet` VARCHAR(191) NOT NULL,
    `victimNumber` VARCHAR(191) NOT NULL,
    `victimDistrict` VARCHAR(191) NOT NULL,
    `victimAnnex` VARCHAR(191) NOT NULL DEFAULT '',
    `victimCommunity` VARCHAR(191) NOT NULL DEFAULT '',
    `victimReference` VARCHAR(191) NOT NULL,
    `aggressorName` VARCHAR(191) NOT NULL,
    `aggressorDni` VARCHAR(191) NOT NULL,
    `aggressorPhone` VARCHAR(191) NOT NULL,
    `aggressorStreet` VARCHAR(191) NOT NULL,
    `aggressorNumber` VARCHAR(191) NOT NULL,
    `aggressorDistrict` VARCHAR(191) NOT NULL,
    `aggressorAnnex` VARCHAR(191) NOT NULL DEFAULT '',
    `aggressorCommunity` VARCHAR(191) NOT NULL DEFAULT '',
    `aggressorReference` VARCHAR(191) NOT NULL,
    `violenceType` VARCHAR(191) NOT NULL,
    `riskLevel` VARCHAR(191) NOT NULL,
    `incidentDescription` VARCHAR(191) NOT NULL,
    `incidentDate` VARCHAR(191) NOT NULL,
    `incidentTime` VARCHAR(191) NOT NULL,
    `incidentLocation` VARCHAR(191) NOT NULL,
    `riskFactors` VARCHAR(191) NOT NULL DEFAULT '[]',
    `additionalObservations` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT 'Pendiente',
    `tags` VARCHAR(191) NOT NULL DEFAULT '[]',
    `isDeleted` BOOLEAN NOT NULL DEFAULT false,
    `deletedAt` DATETIME(3) NULL,
    `integrityHash` VARCHAR(191) NOT NULL,
    `deadlineAt` DATETIME(3) NULL,
    `createdByUid` VARCHAR(191) NOT NULL,
    `createdByUsername` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Case_caseNumber_key`(`caseNumber`),
    INDEX `Case_createdByUid_idx`(`createdByUid`),
    INDEX `Case_status_idx`(`status`),
    INDEX `Case_isDeleted_idx`(`isDeleted`),
    INDEX `Case_createdAt_idx`(`createdAt`),
    INDEX `Case_deadlineAt_idx`(`deadlineAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notification` (
    `id` VARCHAR(191) NOT NULL,
    `caseId` VARCHAR(191) NOT NULL,
    `caseNumber` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Notification_isRead_idx`(`isRead`),
    INDEX `Notification_createdAt_idx`(`createdAt`),
    UNIQUE INDEX `Notification_caseId_key`(`caseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Document` (
    `id` VARCHAR(191) NOT NULL,
    `caseId` VARCHAR(191) NOT NULL,
    `uploadedByUid` VARCHAR(191) NOT NULL,
    `filename` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `sizeBytes` INTEGER NOT NULL,
    `documentType` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `storagePath` VARCHAR(191) NOT NULL,
    `integrityHash` VARCHAR(191) NOT NULL DEFAULT '',
    `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `isDeleted` BOOLEAN NOT NULL DEFAULT false,
    `deletedAt` DATETIME(3) NULL,

    INDEX `Document_caseId_idx`(`caseId`),
    INDEX `Document_isDeleted_idx`(`isDeleted`),
    INDEX `Document_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `officerUid` VARCHAR(191) NOT NULL,
    `officerUsername` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `resourceId` VARCHAR(191) NULL,
    `details` VARCHAR(191) NOT NULL DEFAULT '',
    `userAgent` VARCHAR(191) NOT NULL DEFAULT '',
    `ipAddress` VARCHAR(191) NOT NULL DEFAULT '',
    `hmacSignature` VARCHAR(191) NOT NULL,

    INDEX `AuditLog_timestamp_idx`(`timestamp`),
    INDEX `AuditLog_officerUid_idx`(`officerUid`),
    INDEX `AuditLog_action_idx`(`action`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RateLimit` (
    `key` VARCHAR(191) NOT NULL,
    `count` INTEGER NOT NULL DEFAULT 0,
    `windowStart` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `blockedUntil` DATETIME(3) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Case` ADD CONSTRAINT `Case_createdByUid_fkey` FOREIGN KEY (`createdByUid`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_caseId_fkey` FOREIGN KEY (`caseId`) REFERENCES `Case`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Document` ADD CONSTRAINT `Document_caseId_fkey` FOREIGN KEY (`caseId`) REFERENCES `Case`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Document` ADD CONSTRAINT `Document_uploadedByUid_fkey` FOREIGN KEY (`uploadedByUid`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

