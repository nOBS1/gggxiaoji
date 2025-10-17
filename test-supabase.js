// Supabase 连接测试脚本
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://rfckzemofzlbixicfnib.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmY2t6ZW1vZnpsYml4aWNmbmliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5Mjk3MzksImV4cCI6MjA3NTUwNTczOX0.DoKguEdsklx7vvFhyQcNCOLYwX_0F8LcPbg6rfKJnAo';

console.log('🔍 Supabase 连接测试');
console.log('='.repeat(50));
console.log(`URL: ${SUPABASE_URL}`);
console.log(`Key: ${SUPABASE_ANON_KEY.substring(0, 20)}...`);
console.log('='.repeat(50));

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 测试 1: 检查 users 表
console.log('\n📋 测试 1: 查询 users 表...');
try {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, username')
    .limit(5);
  
  if (error) {
    console.error('❌ Error:', error.message);
    console.error('   Code:', error.code);
    console.error('   Details:', error.details);
  } else {
    console.log(`✅ 成功! 找到 ${data.length} 个用户`);
    console.log('   用户列表:', data);
  }
} catch (err) {
  console.error('❌ 异常:', err.message);
}

// 测试 2: 尝试创建测试用户
console.log('\n📝 测试 2: 创建测试用户...');
try {
  const testUser = {
    email: `test_${Date.now()}@example.com`,
    username: `testuser_${Date.now()}`,
    auth_provider: 'email',
    created_at: new Date().toISOString(),
    last_login: new Date().toISOString()
  };
  
  const { data, error } = await supabase
    .from('users')
    .insert([testUser])
    .select()
    .single();
  
  if (error) {
    console.error('❌ Error:', error.message);
    console.error('   Code:', error.code);
    console.error('   Hint:', error.hint);
  } else {
    console.log('✅ 测试用户创建成功!');
    console.log('   User ID:', data.id);
    
    // 清理测试数据
    await supabase.from('users').delete().eq('id', data.id);
    console.log('   ✓ 测试数据已清理');
  }
} catch (err) {
  console.error('❌ 异常:', err.message);
}

// 测试 3: 检查表结构
console.log('\n🗂️  测试 3: 检查数据库表...');
const tables = ['users', 'profiles', 'inventory', 'upgrades', 'stats', 'market_orders'];
for (const table of tables) {
  try {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1);
    
    if (error) {
      console.log(`   ❌ ${table}: ${error.message}`);
    } else {
      console.log(`   ✅ ${table}: 表存在`);
    }
  } catch (err) {
    console.log(`   ❌ ${table}: ${err.message}`);
  }
}

console.log('\n' + '='.repeat(50));
console.log('测试完成!');
