// ==================== 市场交易功能测试 ====================
// 测试所有市场交易相关功能

import { describe, it, expect } from 'vitest';
import {
  GAME_CONFIG,
  calculateMarketFee,
  calculateSellerReceive,
  calculateUnitPrice,
  isValidPrice,
  isValidQuantity,
  validateMarketOrder,
} from './gameLogic';

describe('市场配置测试', () => {
  it('应该有正确的市场配置', () => {
    expect(GAME_CONFIG.MARKET.FEE_RATE).toBe(0.05);
    expect(GAME_CONFIG.MARKET.MIN_PRICE).toBe(1);
    expect(GAME_CONFIG.MARKET.MAX_PRICE).toBe(1000000);
    expect(GAME_CONFIG.MARKET.MIN_QUANTITY).toBe(1);
    expect(GAME_CONFIG.MARKET.MAX_QUANTITY).toBe(999999);
    expect(GAME_CONFIG.MARKET.MAX_ORDERS_PER_USER).toBe(10);
  });
});

describe('手续费计算测试', () => {
  it('应该正确计算5%手续费', () => {
    expect(calculateMarketFee(100)).toBe(5);
    expect(calculateMarketFee(1000)).toBe(50);
    expect(calculateMarketFee(50)).toBe(2);
  });

  it('应该向下取整手续费', () => {
    expect(calculateMarketFee(99)).toBe(4); // 99 * 0.05 = 4.95 -> 4
    expect(calculateMarketFee(101)).toBe(5); // 101 * 0.05 = 5.05 -> 5
  });

  it('最小金额手续费', () => {
    expect(calculateMarketFee(1)).toBe(0); // 1 * 0.05 = 0.05 -> 0
    expect(calculateMarketFee(20)).toBe(1); // 20 * 0.05 = 1
  });

  it('大额交易手续费', () => {
    expect(calculateMarketFee(10000)).toBe(500);
    expect(calculateMarketFee(100000)).toBe(5000);
  });
});

describe('卖家收入计算测试', () => {
  it('应该正确计算卖家实际收入', () => {
    // 100金币 - 5手续费 = 95
    expect(calculateSellerReceive(100)).toBe(95);
    // 1000金币 - 50手续费 = 950
    expect(calculateSellerReceive(1000)).toBe(950);
  });

  it('小额交易卖家收入', () => {
    expect(calculateSellerReceive(1)).toBe(1); // 1 - 0 = 1
    expect(calculateSellerReceive(20)).toBe(19); // 20 - 1 = 19
  });

  it('大额交易卖家收入', () => {
    expect(calculateSellerReceive(10000)).toBe(9500);
    expect(calculateSellerReceive(100000)).toBe(95000);
  });
});

describe('单价计算测试', () => {
  it('应该正确计算单价', () => {
    expect(calculateUnitPrice(100, 10)).toBe(10);
    expect(calculateUnitPrice(1000, 5)).toBe(200);
  });

  it('应该向下取整单价', () => {
    expect(calculateUnitPrice(100, 3)).toBe(33); // 100/3 = 33.33 -> 33
    expect(calculateUnitPrice(99, 10)).toBe(9); // 99/10 = 9.9 -> 9
  });

  it('单个物品单价', () => {
    expect(calculateUnitPrice(250, 1)).toBe(250);
    expect(calculateUnitPrice(1, 1)).toBe(1);
  });
});

describe('价格验证测试', () => {
  it('应该接受有效价格', () => {
    expect(isValidPrice(1)).toBe(true); // 最小值
    expect(isValidPrice(100)).toBe(true);
    expect(isValidPrice(1000)).toBe(true);
    expect(isValidPrice(1000000)).toBe(true); // 最大值
  });

  it('应该拒绝无效价格', () => {
    expect(isValidPrice(0)).toBe(false); // 小于最小值
    expect(isValidPrice(-10)).toBe(false); // 负数
    expect(isValidPrice(1000001)).toBe(false); // 大于最大值
    expect(isValidPrice(10.5)).toBe(false); // 非整数
  });
});

describe('数量验证测试', () => {
  it('应该接受有效数量', () => {
    expect(isValidQuantity(1)).toBe(true); // 最小值
    expect(isValidQuantity(10)).toBe(true);
    expect(isValidQuantity(100)).toBe(true);
    expect(isValidQuantity(999999)).toBe(true); // 最大值
  });

  it('应该拒绝无效数量', () => {
    expect(isValidQuantity(0)).toBe(false); // 小于最小值
    expect(isValidQuantity(-5)).toBe(false); // 负数
    expect(isValidQuantity(1000000)).toBe(false); // 大于最大值
    expect(isValidQuantity(5.5)).toBe(false); // 非整数
  });
});

describe('订单参数验证测试', () => {
  it('应该接受有效订单', () => {
    const result = validateMarketOrder('white', 10, 100);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('应该拒绝无效稀有度', () => {
    const result = validateMarketOrder('invalid', 10, 100);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('INVALID_RARITY');
  });

  it('应该拒绝无效数量', () => {
    const result = validateMarketOrder('white', 0, 100);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('INVALID_QUANTITY');
  });

  it('应该拒绝无效价格', () => {
    const result = validateMarketOrder('white', 10, 0);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('INVALID_PRICE');
  });

  it('应该验证所有稀有度', () => {
    expect(validateMarketOrder('white', 1, 1).valid).toBe(true);
    expect(validateMarketOrder('brown', 1, 1).valid).toBe(true);
    expect(validateMarketOrder('silver', 1, 1).valid).toBe(true);
    expect(validateMarketOrder('gold', 1, 1).valid).toBe(true);
    expect(validateMarketOrder('purple', 1, 1).valid).toBe(true);
    expect(validateMarketOrder('black', 1, 1).valid).toBe(true);
  });
});

describe('市场交易场景测试', () => {
  it('场景1: 出售10个白蛋，价格100金币', () => {
    const quantity = 10;
    const totalPrice = 100;
    const unitPrice = calculateUnitPrice(totalPrice, quantity);
    const fee = calculateMarketFee(totalPrice);
    const sellerReceive = calculateSellerReceive(totalPrice);

    expect(unitPrice).toBe(10); // 每个10金币
    expect(fee).toBe(5); // 5%手续费
    expect(sellerReceive).toBe(95); // 卖家收95金币
  });

  it('场景2: 出售1个黑蛋，价格10000金币', () => {
    const quantity = 1;
    const totalPrice = 10000;
    const unitPrice = calculateUnitPrice(totalPrice, quantity);
    const fee = calculateMarketFee(totalPrice);
    const sellerReceive = calculateSellerReceive(totalPrice);

    expect(unitPrice).toBe(10000);
    expect(fee).toBe(500); // 500金币手续费
    expect(sellerReceive).toBe(9500); // 卖家收9500金币
  });

  it('场景3: 批量出售100个棕蛋，价格500金币', () => {
    const quantity = 100;
    const totalPrice = 500;
    const unitPrice = calculateUnitPrice(totalPrice, quantity);
    const fee = calculateMarketFee(totalPrice);
    const sellerReceive = calculateSellerReceive(totalPrice);

    expect(unitPrice).toBe(5); // 每个5金币
    expect(fee).toBe(25);
    expect(sellerReceive).toBe(475);
  });

  it('场景4: 最小交易 - 1个蛋1金币', () => {
    const validation = validateMarketOrder('white', 1, 1);
    expect(validation.valid).toBe(true);

    const fee = calculateMarketFee(1);
    const sellerReceive = calculateSellerReceive(1);
    
    expect(fee).toBe(0); // 手续费向下取整为0
    expect(sellerReceive).toBe(1); // 卖家仍收到1金币
  });

  it('场景5: 手续费临界点测试', () => {
    // 19金币时手续费为0（19*0.05=0.95）
    expect(calculateMarketFee(19)).toBe(0);
    expect(calculateSellerReceive(19)).toBe(19);

    // 20金币时手续费为1（20*0.05=1）
    expect(calculateMarketFee(20)).toBe(1);
    expect(calculateSellerReceive(20)).toBe(19);
  });
});

describe('边界条件测试', () => {
  it('最大价格最大数量订单', () => {
    const validation = validateMarketOrder(
      'black',
      GAME_CONFIG.MARKET.MAX_QUANTITY,
      GAME_CONFIG.MARKET.MAX_PRICE
    );
    expect(validation.valid).toBe(true);

    const fee = calculateMarketFee(GAME_CONFIG.MARKET.MAX_PRICE);
    expect(fee).toBe(50000); // 1000000 * 0.05
  });

  it('最小价格最小数量订单', () => {
    const validation = validateMarketOrder(
      'white',
      GAME_CONFIG.MARKET.MIN_QUANTITY,
      GAME_CONFIG.MARKET.MIN_PRICE
    );
    expect(validation.valid).toBe(true);

    const fee = calculateMarketFee(GAME_CONFIG.MARKET.MIN_PRICE);
    expect(fee).toBe(0); // 1 * 0.05 = 0.05 -> 0
  });

  it('超出边界的订单', () => {
    // 超出数量上限
    expect(validateMarketOrder('white', GAME_CONFIG.MARKET.MAX_QUANTITY + 1, 100).valid).toBe(false);
    
    // 超出价格上限
    expect(validateMarketOrder('white', 10, GAME_CONFIG.MARKET.MAX_PRICE + 1).valid).toBe(false);
    
    // 低于数量下限
    expect(validateMarketOrder('white', GAME_CONFIG.MARKET.MIN_QUANTITY - 1, 100).valid).toBe(false);
    
    // 低于价格下限
    expect(validateMarketOrder('white', 10, GAME_CONFIG.MARKET.MIN_PRICE - 1).valid).toBe(false);
  });
});

describe('手续费公平性测试', () => {
  it('相同总价的订单应该有相同手续费', () => {
    const totalPrice = 1000;
    
    // 不管数量如何，总价相同手续费相同
    const fee1 = calculateMarketFee(totalPrice);
    const fee2 = calculateMarketFee(totalPrice);
    
    expect(fee1).toBe(fee2);
    expect(fee1).toBe(50);
  });

  it('买家支付 = 卖家收入 + 手续费', () => {
    const testPrices = [1, 20, 100, 500, 1000, 10000, 100000];
    
    testPrices.forEach(price => {
      const fee = calculateMarketFee(price);
      const sellerReceive = calculateSellerReceive(price);
      
      expect(sellerReceive + fee).toBe(price);
    });
  });

  it('手续费不应超过总价的5%', () => {
    const testPrices = [100, 500, 1000, 5000, 10000, 50000, 100000];
    
    testPrices.forEach(price => {
      const fee = calculateMarketFee(price);
      const feeRate = fee / price;
      
      // 因为向下取整，实际费率应该 <= 5%
      expect(feeRate).toBeLessThanOrEqual(0.05);
    });
  });
});
