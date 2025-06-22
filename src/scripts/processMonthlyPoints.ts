import { SubscriptionService } from "@/services/SubscriptionService";

async function main() {
  try {
    console.log("开始处理每月赠送积分...");
    await SubscriptionService.processMonthlyPoints();
    console.log("每月赠送积分处理完成");
  } catch (error) {
    console.error("处理每月赠送积分时出错:", error);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}