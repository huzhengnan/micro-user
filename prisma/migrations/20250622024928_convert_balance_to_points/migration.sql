/*
  Warnings:

  - The values [DEPOSIT,WITHDRAWAL] on the enum `TransactionType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `price` on the `SubscriptionPlan` table. All the data in the column will be lost.
  - You are about to alter the column `amount` on the `Transaction` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Integer`.
  - You are about to drop the column `balance` on the `User` table. All the data in the column will be lost.
  - Added the required column `pointsPrice` to the `SubscriptionPlan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TransactionType_new" AS ENUM ('TOPUP', 'REDEEM', 'SUBSCRIPTION', 'REFUND', 'EARN', 'EXPIRE');
ALTER TABLE "Transaction" ALTER COLUMN "type" TYPE "TransactionType_new" USING ("type"::text::"TransactionType_new");
ALTER TYPE "TransactionType" RENAME TO "TransactionType_old";
ALTER TYPE "TransactionType_new" RENAME TO "TransactionType";
DROP TYPE "TransactionType_old";
COMMIT;

-- AlterTable
ALTER TABLE "SubscriptionPlan" DROP COLUMN "price",
ADD COLUMN     "pointsPrice" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Transaction" ALTER COLUMN "amount" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "balance",
ADD COLUMN     "points" INTEGER NOT NULL DEFAULT 0;
