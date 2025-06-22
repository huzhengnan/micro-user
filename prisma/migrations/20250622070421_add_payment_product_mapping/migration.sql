-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('CREEM', 'STRIPE', 'PAYPAL', 'ALIPAY', 'WECHAT');

-- CreateTable
CREATE TABLE "PaymentProductMapping" (
    "id" TEXT NOT NULL,
    "subscriptionPlanId" TEXT NOT NULL,
    "paymentProvider" "PaymentProvider" NOT NULL,
    "productId" TEXT NOT NULL,
    "priceId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentProductMapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentProductMapping_subscriptionPlanId_paymentProvider_key" ON "PaymentProductMapping"("subscriptionPlanId", "paymentProvider");

-- AddForeignKey
ALTER TABLE "PaymentProductMapping" ADD CONSTRAINT "PaymentProductMapping_subscriptionPlanId_fkey" FOREIGN KEY ("subscriptionPlanId") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
