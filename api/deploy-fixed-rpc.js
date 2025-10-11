// ==================== 部署修复后的 RPC 函数 ====================
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sqlPath = path.join(__dirname, 'migrations', '0003_market_functions_fixed.sql');
const sql = fs.readFileSync(sqlPath, 'utf-8');

console.log('📋 修复后的 RPC 函数 SQL:');
console.log('========================================\n');
console.log('文件路径:', sqlPath);
console.log('文件大小:', sql.length, '字符\n');
console.log('========================================\n');
console.log('⚠️  请在 Supabase Dashboard 中执行此 SQL:\n');
console.log('1. 打开: https://supabase.com/dashboard/project/rfckzemofzlbixicfnib/sql/new\n');
console.log('2. 复制以下 SQL 内容\n');
console.log('3. 粘贴到 SQL Editor\n');
console.log('4. 点击 "Run" 按钮执行\n');
console.log('========================================\n');
console.log('SQL 内容:');
console.log('========================================\n');
console.log(sql);
console.log('\n========================================');
console.log('✅ 修复内容:');
console.log('- 将参数类型从 TEXT 改为 UUID');
console.log('- 删除旧的 TEXT 版本函数');
console.log('- 创建新的 UUID 版本函数');
console.log('========================================\n');
