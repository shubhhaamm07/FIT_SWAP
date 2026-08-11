ALTER TABLE "User"
ADD COLUMN "username" TEXT,
ADD COLUMN "bio" TEXT,
ADD COLUMN "city" TEXT,
ADD COLUMN "isProfilePublic" BOOLEAN NOT NULL DEFAULT true;

CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
