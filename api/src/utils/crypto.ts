// ==================== 密码加密工具 ====================
// 使用 bcrypt 对密码进行安全哈希和验证

import bcrypt from 'bcryptjs';

// bcrypt 配置
const SALT_ROUNDS = 12; // 推荐值：10-12，数值越高越安全但越慢

/**
 * 哈希密码（使用 bcrypt）
 * @param password - 明文密码
 * @returns 哈希后的密码（包含盐值）
 * 
 * 安全特性：
 * - 自动生成随机盐值
 * - 慢速哈希算法（防暴力破解）
 * - 工业标准密码存储方案
 */
export const hashPassword = async (password: string): Promise<string> => {
  try {
    // 验证密码长度
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }
    
    if (password.length > 72) {
      throw new Error('Password must not exceed 72 characters');
    }
    
    // 使用 bcrypt 生成哈希（自动生成盐值）
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    return hash;
  } catch (error) {
    console.error('[Password Hash Error]', error);
    throw new Error('Failed to hash password');
  }
};

/**
 * 验证密码
 * @param password - 明文密码
 * @param hashedPassword - 存储的哈希密码
 * @returns 密码是否匹配
 */
export const verifyPassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  try {
    // 验证输入
    if (!password || !hashedPassword) {
      return false;
    }
    
    // 使用 bcrypt 比较密码
    const isMatch = await bcrypt.compare(password, hashedPassword);
    return isMatch;
  } catch (error) {
    console.error('[Password Verify Error]', error);
    return false;
  }
};

/**
 * 检查密码强度
 * @param password - 明文密码
 * @returns 密码强度评分和建议
 */
export const checkPasswordStrength = (password: string): {
  score: number; // 0-5
  strength: 'very-weak' | 'weak' | 'fair' | 'good' | 'strong' | 'very-strong';
  suggestions: string[];
} => {
  let score = 0;
  const suggestions: string[] = [];
  
  // 长度检查
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  
  // 复杂度检查
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  
  // 生成建议
  if (password.length < 8) suggestions.push('Use at least 8 characters');
  if (!/[a-z]/.test(password)) suggestions.push('Add lowercase letters');
  if (!/[A-Z]/.test(password)) suggestions.push('Add uppercase letters');
  if (!/[0-9]/.test(password)) suggestions.push('Add numbers');
  if (!/[^a-zA-Z0-9]/.test(password)) suggestions.push('Add special characters');
  
  // 确定强度等级
  const strengthMap = {
    0: 'very-weak' as const,
    1: 'weak' as const,
    2: 'fair' as const,
    3: 'good' as const,
    4: 'strong' as const,
    5: 'very-strong' as const,
    6: 'very-strong' as const,
  };
  
  return {
    score,
    strength: strengthMap[Math.min(score, 6)],
    suggestions,
  };
};

// ✅ 安全性已修复！
// - 使用 bcrypt（工业标准）
// - 自动盐值生成
// - 防暴力破解（慢速哈希）
// - 密码长度验证
// - 密码强度检查功能
