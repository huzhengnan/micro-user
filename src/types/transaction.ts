/**
 * 交易元数据接口
 * 用于定义 Transaction 模型中 metadata 字段的类型
 */
export interface TransactionMetadata {
  // 支付相关
  paymentMethod?: string;       // 支付方式：'credit_card', 'creem' 等
  paymentId?: string;           // 支付ID
  checkoutId?: string;          // 结账会话ID
  requestId?: string;           // 请求ID
  
  // 订阅相关
  subscriptionId?: string;      // 订阅ID
  planId?: string;              // 订阅计划ID
  month?: number;               // 月份计数（用于月度积分）
  
  // 用户相关
  userId?: string;              // 用户ID
  description?: string;         // 描述信息
  
  // 其他可能的字段
  [key: string]: any;           // 允许添加其他字段
}