/*
  Warnings:

  - You are about to drop the column `pointsPrice` on the `SubscriptionPlan` table. All the data in the column will be lost.
  - Added the required column `monthlyPoints` to the `SubscriptionPlan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price` to the `SubscriptionPlan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SubscriptionPlan" DROP COLUMN "pointsPrice",
ADD COLUMN     "monthlyPoints" INTEGER NOT NULL,
ADD COLUMN     "price" INTEGER NOT NULL;
