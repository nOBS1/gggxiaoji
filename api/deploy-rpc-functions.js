// ==================== Supabase RPC 函数部署脚本 ====================
// 自动将 RPC 函数部署到 Supabase
// 使用方法: node deploy-rpc-functions.js

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少 SUPABASE_URL 或 SUPABASE_ANON_KEY 环境变量');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 读取 RPC 函数 SQL 文件
const sqlFilePath = path.join(__dirname, 'migrations', '0003_market_functions.sql');

console.log('📂 读取 SQL 文件:', sqlFilePath);

if (!fs.existsSync(sqlFilePath)) {
  console.error('❌ SQL 文件不存在:', sqlFilePath);
  process.exit(1);
}

const sql = fs.readFileSync(sqlFilePath, 'utf-8');

console.log('📄 SQL 文件大小:', sql.length, '字符');
console.log('\n========================================');
console.log('⚠️  注意：Supabase JavaScript 客户端不支持直接执行 SQL');
console.log('========================================\n');

console.log('✅ 请使用以下方法之一部署 RPC 函数：\n');

console.log('方法 1: 使用 Supabase Dashboard (推荐)');
console.log('----------------------------------------');
console.log('1. 打开: https://supabase.com/dashboard/project/rfckzemofzlbixicfnib/sql/new');
console.log('2. 复制文件内容: migrations/0003_market_functions.sql');
console.log('3. 粘贴到 SQL Editor');
console.log('4. 点击 "Run" 按钮执行\n');

console.log('方法 2: 使用 Supabase CLI');
console.log('----------------------------------------');
console.log('1. 安装 Supabase CLI: npm install -g supabase');
console.log('2. 登录: supabase login');
console.log('3. 关联项目: supabase link --project-ref rfckzemofzlbixicfnib');
console.log('4. 执行迁移: supabase db push\n');

console.log('方法 3: 使用 psql 命令行');
console.log('----------------------------------------');
console.log('1. 获取数据库连接字符串（Dashboard → Project Settings → Database）');
console.log('2. 执行: psql "postgresql://..." -f migrations/0003_market_functions.sql\n');

console.log('========================================');
console.log('📋 需要创建的 RPC 函数:');
console.log('========================================');
console.log('1. create_market_order()    - 创建市场订单');
console.log('2. buy_market_order()       - 购买订单');
console.log('3. cancel_market_order()    - 取消订单');
console.log('4. get_market_stats()       - 获取市场统计\n');

// 提供一个简单的测试函数
async function testRPCFunctions() {
  console.log('🧪 测试 RPC 函数是否已部署...\n');
  
  try {
    // 测试 get_market_stats (不需要参数)
    const { data, error } = await supabase.rpc('get_market_stats');
    
    if (error) {
      if (error.message.includes('does not exist')) {
        console.log('❌ RPC 函数尚未部署');
        console.log('   请使用上述方法之一部署 SQL 文件\n');
      } else {
        console.log('⚠️  RPC 函数可能已存在，但返回错误:', error.message);
      }
    } else {
      console.log('✅ RPC 函数已成功部署！');
      console.log('📊 市场统计:', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error('❌ 测试失败:', err.message);
  }
}

// 运行测试
testRPCFunctions();
