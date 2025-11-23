-- CreateTable
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "targetDate" DATETIME,
    "completionDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    "managerId" TEXT,
    CONSTRAINT "Goal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Goal_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GoalUpdate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "goalId" TEXT NOT NULL,
    "oldProgress" INTEGER NOT NULL,
    "newProgress" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,
    CONSTRAINT "GoalUpdate_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GoalUpdate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReviewCycle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "frequency" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "nextRunDate" DATETIME,
    "lastRunDate" DATETIME,
    "templateId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "departments" TEXT,
    "includeAllUsers" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ReviewCycle_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "FormTemplate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PerformanceReview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "cycleId" TEXT,
    "status" TEXT NOT NULL,
    "overallScore" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PerformanceReview_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "FormTemplate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PerformanceReview_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PerformanceReview_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PerformanceReview_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "ReviewCycle" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PerformanceReview" ("createdAt", "employeeId", "id", "managerId", "overallScore", "status", "templateId", "updatedAt") SELECT "createdAt", "employeeId", "id", "managerId", "overallScore", "status", "templateId", "updatedAt" FROM "PerformanceReview";
DROP TABLE "PerformanceReview";
ALTER TABLE "new_PerformanceReview" RENAME TO "PerformanceReview";
CREATE INDEX "PerformanceReview_employeeId_idx" ON "PerformanceReview"("employeeId");
CREATE INDEX "PerformanceReview_managerId_idx" ON "PerformanceReview"("managerId");
CREATE INDEX "PerformanceReview_cycleId_idx" ON "PerformanceReview"("cycleId");
CREATE INDEX "PerformanceReview_status_idx" ON "PerformanceReview"("status");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE INDEX "Goal_userId_idx" ON "Goal"("userId");

-- CreateIndex
CREATE INDEX "Goal_managerId_idx" ON "Goal"("managerId");

-- CreateIndex
CREATE INDEX "Goal_status_idx" ON "Goal"("status");

-- CreateIndex
CREATE INDEX "GoalUpdate_goalId_idx" ON "GoalUpdate"("goalId");

-- CreateIndex
CREATE INDEX "ReviewCycle_isActive_idx" ON "ReviewCycle"("isActive");

-- CreateIndex
CREATE INDEX "ReviewCycle_nextRunDate_idx" ON "ReviewCycle"("nextRunDate");
