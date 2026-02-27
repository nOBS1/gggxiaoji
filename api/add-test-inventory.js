// ==================== 添加测试用户库存 ====================
// 为测试用户添加一些金蛋，以便测试市场功能

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少环境变量');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 测试用户 ID
const TEST_USER_ID = 'f92e7cec-391a-486c-a474-bac5f240fe58';
const TEST_EMAIL = 'testuser1760111765@test.com';

async function addTestInventory() {
  console.log('🎮 为测试用户添加库存...\n');
  console.log(`用户 ID: ${TEST_USER_ID}`);
  console.log(`邮箱: ${TEST_EMAIL}\n`);
  
  try {
    // 1. 检查用户是否存在
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', TEST_USER_ID)
      .single();
    
    if (userError || !user) {
      console.log('❌ 用户不存在');
      return;
    }
    
    console.log('✅ 用户存在:', user.email);
    
    // 2. 检查当前库存
    const { data: currentInventory, error: invError } = await supabase
      .from('inventory')
      .select('rarity, quantity')
      .eq('user_id', TEST_USER_ID);
    
    if (invError) {
      console.error('❌ 查询库存失败:', invError.message);
      return;
    }
    
    console.log('\n📦 当前库存:');
    if (currentInventory && currentInventory.length > 0) {
      currentInventory.forEach(item => {
        console.log(`  ${item.rarity}: ${item.quantity}`);
      });
    } else {
      console.log('  （空）');
    }
    
    // 3. 添加测试库存
    const testInventory = [
      { rarity: 'white', quantity: 100 },
      { rarity: 'brown', quantity: 50 },
      { rarity: 'silver', quantity: 30 },
      { rarity: 'gold', quantity: 20 },
      { rarity: 'purple', quantity: 10 },
      { rarity: 'black', quantity: 5 },
    ];
    
    console.log('\n🔄 更新库存...');
    
    for (const item of testInventory) {
      const { error: updateError } = await supabase
        .from('inventory')
        .update({ quantity: item.quantity })
        .eq('user_id', TEST_USER_ID)
        .eq('rarity', item.rarity);
      
      if (updateError) {
        console.error(`❌ 更新 ${item.rarity} 失败:`, updateError.message);
      } else {
        console.log(`✅ ${item.rarity}: ${item.quantity}`);
      }
    }
    
    // 4. 添加一些金币
    const COINS = 10000;
    const { error: coinsError } = await supabase
      .from('profiles')
      .update({ coins: COINS })
      .eq('user_id', TEST_USER_ID);
    
    if (coinsError) {
      console.error('❌ 更新金币失败:', coinsError.message);
    } else {
      console.log(`\n💰 金币: ${COINS}`);
    }
    
    // 5. 验证更新后的库存
    const { data: newInventory } = await supabase
      .from('inventory')
      .select('rarity, quantity')
      .eq('user_id', TEST_USER_ID);
    
    console.log('\n📦 更新后的库存:');
    if (newInventory && newInventory.length > 0) {
      newInventory.forEach(item => {
        console.log(`  ${item.rarity}: ${item.quantity}`);
      });
    }
    
    console.log('\n✅ 测试数据添加完成！');
    console.log('\n现在可以测试以下功能:');
    console.log('1. 创建市场订单（卖金蛋）');
    console.log('2. 购买市场订单');
    console.log('3. 取消订单');
    
  } catch (error) {
    console.error('❌ 操作失败:', error);
  }
}

addTestInventory();
