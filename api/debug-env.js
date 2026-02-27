/**
 * 环境变量调试脚本
 * 检查所有必需的环境变量是否正确加载
 */

import 'dotenv/config';

console.log('🔍 检查环境变量加载情况...\n');

const requiredVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'JWT_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_REDIRECT_URI',
  'PORT'
];

let allLoaded = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    // 隐藏敏感信息，只显示前15个字符
    const displayValue = value.length > 20 ? value.substring(0, 20) + '...' : value;
    console.log(`✅ ${varName.padEnd(25)} = ${displayValue}`);
  } else {
    console.log(`❌ ${varName.padEnd(25)} = (未设置)`);
    allLoaded = false;
  }
});

console.log('\n' + '='.repeat(60));

if (allLoaded) {
  console.log('✅ 所有环境变量已正确加载！\n');
  console.log('🚀 可以启动服务器了: npm run dev\n');
} else {
  console.log('❌ 部分环境变量未加载！\n');
  console.log('请检查 .env 和 .dev.vars 文件。\n');
}
