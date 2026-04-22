-- CreateEnum
CREATE TYPE "RunStatus" AS ENUM ('RUNNING', 'SUCCESS', 'FAILED', 'WAITING');

-- CreateEnum
CREATE TYPE "StepStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED', 'SKIPPED');

-- CreateTable
CREATE TABLE "Workflow" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "trigger" JSONB NOT NULL,
    "nodes" JSONB NOT NULL,
    "edges" JSONB NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowRun" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "triggerData" JSONB NOT NULL,
    "status" "RunStatus" NOT NULL DEFAULT 'RUNNING',
    "leadId" TEXT,
    "resumeAt" TIMESTAMP(3),
    "cursorNode" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "WorkflowRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowStep" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "nodeType" TEXT NOT NULL,
    "label" TEXT,
    "input" JSONB NOT NULL,
    "output" JSONB,
    "status" "StepStatus" NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "WorkflowStep_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Workflow_ownerId_idx" ON "Workflow"("ownerId");

-- CreateIndex
CREATE INDEX "Workflow_enabled_idx" ON "Workflow"("enabled");

-- CreateIndex
CREATE INDEX "WorkflowRun_workflowId_startedAt_idx" ON "WorkflowRun"("workflowId", "startedAt");

-- CreateIndex
CREATE INDEX "WorkflowRun_status_idx" ON "WorkflowRun"("status");

-- CreateIndex
CREATE INDEX "WorkflowRun_resumeAt_idx" ON "WorkflowRun"("resumeAt");

-- CreateIndex
CREATE INDEX "WorkflowRun_leadId_idx" ON "WorkflowRun"("leadId");

-- CreateIndex
CREATE INDEX "WorkflowStep_runId_startedAt_idx" ON "WorkflowStep"("runId", "startedAt");

-- CreateIndex
CREATE INDEX "WorkflowStep_status_idx" ON "WorkflowStep"("status");

-- AddForeignKey
ALTER TABLE "Workflow" ADD CONSTRAINT "Workflow_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowRun" ADD CONSTRAINT "WorkflowRun_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowRun" ADD CONSTRAINT "WorkflowRun_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowStep" ADD CONSTRAINT "WorkflowStep_runId_fkey" FOREIGN KEY ("runId") REFERENCES "WorkflowRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
