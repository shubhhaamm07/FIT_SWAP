-- CreateTable
CREATE TABLE "GymImage" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "imageKey" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GymImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GymImage_imageKey_key" ON "GymImage"("imageKey");

-- CreateIndex
CREATE INDEX "GymImage_gymId_idx" ON "GymImage"("gymId");

-- AddForeignKey
ALTER TABLE "GymImage" ADD CONSTRAINT "GymImage_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;
