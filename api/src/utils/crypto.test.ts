// ==================== 密码加密工具测试 ====================
// 测试 bcrypt 密码哈希和验证功能

import { hashPassword, verifyPassword, checkPasswordStrength } from './crypto';

/**
 * 测试套件：密码哈希和验证
 */
async function testPasswordSecurity() {
  console.log('🧪 开始测试密码安全功能...\n');

  // 测试 1: 基本哈希功能
  console.log('测试 1: 基本密码哈希');
  try {
    const password = 'MySecurePassword123!';
    const hash = await hashPassword(password);
    
    console.log('✅ 密码哈希成功');
    console.log(`  原始密码: ${password}`);
    console.log(`  哈希结果: ${hash}`);
    console.log(`  哈希长度: ${hash.length} 字符\n`);
  } catch (error) {
    console.error('❌ 密码哈希失败:', error);
  }

  // 测试 2: 密码验证
  console.log('测试 2: 密码验证');
  try {
    const password = 'TestPassword123!';
    const hash = await hashPassword(password);
    
    const isValid = await verifyPassword(password, hash);
    const isInvalid = await verifyPassword('WrongPassword', hash);
    
    if (isValid && !isInvalid) {
      console.log('✅ 密码验证成功');
      console.log(`  正确密码验证: ${isValid}`);
      console.log(`  错误密码验证: ${isInvalid}\n`);
    } else {
      console.error('❌ 密码验证逻辑错误');
    }
  } catch (error) {
    console.error('❌ 密码验证失败:', error);
  }

  // 测试 3: 盐值唯一性
  console.log('测试 3: 盐值唯一性（相同密码生成不同哈希）');
  try {
    const password = 'SamePassword123!';
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);
    
    if (hash1 !== hash2) {
      console.log('✅ 盐值唯一性验证成功');
      console.log(`  第一次哈希: ${hash1}`);
      console.log(`  第二次哈希: ${hash2}`);
      console.log('  两次哈希结果不同，说明每次都生成了新的盐值\n');
    } else {
      console.error('❌ 盐值唯一性验证失败：两次哈希结果相同');
    }
  } catch (error) {
    console.error('❌ 盐值唯一性测试失败:', error);
  }

  // 测试 4: 密码长度验证
  console.log('测试 4: 密码长度验证');
  try {
    // 测试过短密码
    try {
      await hashPassword('12345');
      console.error('❌ 应该拒绝过短的密码');
    } catch (error) {
      console.log('✅ 正确拒绝过短密码 (< 6 字符)');
    }
    
    // 测试过长密码
    try {
      const longPassword = 'a'.repeat(73);
      await hashPassword(longPassword);
      console.error('❌ 应该拒绝过长的密码');
    } catch (error) {
      console.log('✅ 正确拒绝过长密码 (> 72 字符)\n');
    }
  } catch (error) {
    console.error('❌ 密码长度验证测试失败:', error);
  }

  // 测试 5: 密码强度检查
  console.log('测试 5: 密码强度检查');
  const testPasswords = [
    '123456',
    'password',
    'Password1',
    'P@ssw0rd',
    'MySecureP@ssw0rd123',
  ];
  
  testPasswords.forEach((pwd) => {
    const result = checkPasswordStrength(pwd);
    console.log(`  密码: "${pwd}"`);
    console.log(`    强度: ${result.strength} (${result.score}/6)`);
    if (result.suggestions.length > 0) {
      console.log(`    建议: ${result.suggestions.join(', ')}`);
    }
    console.log('');
  });

  // 测试 6: 性能测试
  console.log('测试 6: 性能测试');
  try {
    const startTime = Date.now();
    await hashPassword('PerformanceTest123!');
    const duration = Date.now() - startTime;
    
    console.log(`✅ 哈希耗时: ${duration}ms`);
    if (duration > 50 && duration < 500) {
      console.log('  哈希速度适中，符合安全要求（防暴力破解）\n');
    } else if (duration > 500) {
      console.log('  ⚠️ 哈希速度较慢，可以考虑降低 SALT_ROUNDS\n');
    } else {
      console.log('  ⚠️ 哈希速度过快，建议增加 SALT_ROUNDS\n');
    }
  } catch (error) {
    console.error('❌ 性能测试失败:', error);
  }

  // 测试 7: 并发测试
  console.log('测试 7: 并发哈希测试');
  try {
    const startTime = Date.now();
    const passwords = ['Pass1!', 'Pass2!', 'Pass3!', 'Pass4!', 'Pass5!'];
    
    const hashes = await Promise.all(
      passwords.map(pwd => hashPassword(pwd))
    );
    
    const duration = Date.now() - startTime;
    const allUnique = new Set(hashes).size === hashes.length;
    
    if (allUnique) {
      console.log(`✅ 并发哈希成功，所有哈希值唯一`);
      console.log(`  处理 ${passwords.length} 个密码耗时: ${duration}ms\n`);
    } else {
      console.error('❌ 并发哈希失败：存在重复哈希值');
    }
  } catch (error) {
    console.error('❌ 并发测试失败:', error);
  }

  console.log('🎉 所有测试完成！\n');
  console.log('='.repeat(60));
  console.log('安全性改进总结：');
  console.log('✅ 使用 bcrypt 替代 SHA-256');
  console.log('✅ 自动生成随机盐值');
  console.log('✅ 防暴力破解（慢速哈希）');
  console.log('✅ 密码长度验证');
  console.log('✅ 密码强度检查功能');
  console.log('='.repeat(60));
}

// 运行测试
testPasswordSecurity().catch(console.error);
