// ==================== 错误处理中间件 ====================
// 统一的错误响应格式，支持中英文国际化

import { Context } from 'hono';

export class AppError extends Error {
  constructor(
    public code: string,
    public messageZh: string,
    public messageEn: string,
    public statusCode: number = 400
  ) {
    super(messageEn);
    this.name = 'AppError';
  }
}

export const errorHandler = (err: Error, c: Context) => {
  console.error('[Error]', err);

  const lang = c.req.header('Accept-Language')?.startsWith('zh') ? 'zh' : 'en';

  // 自定义应用错误
  if (err instanceof AppError) {
    return c.json(
      {
        success: false,
        error: {
          code: err.code,
          message: lang === 'zh' ? err.messageZh : err.messageEn,
        },
      },
      err.statusCode
    );
  }

  // 通用错误
  return c.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message:
          lang === 'zh'
            ? '服务器内部错误，请稍后重试'
            : 'Internal server error. Please try again later.',
      },
    },
    500
  );
};

// ==================== 预定义错误 ====================

export const Errors = {
  // 认证错误
  UNAUTHORIZED: new AppError(
    'UNAUTHORIZED',
    '未授权，请先登录',
    'Unauthorized. Please login first.',
    401
  ),
  INVALID_TOKEN: new AppError(
    'INVALID_TOKEN',
    'Token无效或已过期',
    'Invalid or expired token',
    401
  ),
  INVALID_CREDENTIALS: new AppError(
    'INVALID_CREDENTIALS',
    '邮箱或密码错误',
    'Invalid email or password',
    401
  ),
  EMAIL_EXISTS: new AppError(
    'EMAIL_EXISTS',
    '该邮箱已被注册',
    'Email already exists',
    409
  ),

  // 请求错误
  INVALID_INPUT: new AppError(
    'INVALID_INPUT',
    '请求参数无效',
    'Invalid input parameters',
    400
  ),
  MISSING_FIELDS: new AppError(
    'MISSING_FIELDS',
    '缺少必填字段',
    'Missing required fields',
    400
  ),

  // 资源错误
  NOT_FOUND: new AppError(
    'NOT_FOUND',
    '请求的资源未找到',
    'Resource not found',
    404
  ),
  INSUFFICIENT_COINS: new AppError(
    'INSUFFICIENT_COINS',
    '金币不足',
    'Insufficient coins',
    400
  ),
  INSUFFICIENT_INVENTORY: new AppError(
    'INSUFFICIENT_INVENTORY',
    '库存不足',
    'Insufficient inventory',
    400
  ),

  // 业务逻辑错误
  ORDER_NOT_AVAILABLE: new AppError(
    'ORDER_NOT_AVAILABLE',
    '订单已失效或被购买',
    'Order is no longer available',
    400
  ),
  CANNOT_BUY_OWN_ORDER: new AppError(
    'CANNOT_BUY_OWN_ORDER',
    '不能购买自己的订单',
    'Cannot buy your own order',
    400
  ),
  NOT_TRADABLE: new AppError(
    'NOT_TRADABLE',
    '该类型的蛋不可交易，只能交易紫蛋、金蛋和黑蛋',
    'This egg type cannot be traded. Only purple, gold, and black eggs are tradable.',
    400
  ),
  RARITY_MARKET_ONLY: new AppError(
    'RARITY_MARKET_ONLY',
    '紫蛋及以上稀有度只能在交易市场出售',
    'Purple and higher rarity eggs can only be sold on the marketplace.',
    400
  ),
  MAX_UPGRADE_LEVEL: new AppError(
    'MAX_UPGRADE_LEVEL',
    '已达到最大升级等级',
    'Maximum upgrade level reached',
    400
  ),
  AD_COOLDOWN: new AppError(
    'AD_COOLDOWN',
    '广告冷却中，请稍后再试',
    'Ad on cooldown. Please try again later.',
    400
  ),

  // 服务器错误
  DATABASE_ERROR: new AppError(
    'DATABASE_ERROR',
    '数据库错误',
    'Database error',
    500
  ),
};
