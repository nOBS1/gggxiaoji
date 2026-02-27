// ==================== 直接测试 RPC 函数 ====================
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

// 直接使用配置（避免 dotenv 问题）
const supabaseUrl = 'https://rfckzemofzlbixicfnib.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmY2t6ZW1vZnpsYml4aWNmbmliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5Mjk3MzksImV4cCI6MjA3NTUwNTczOX0.DoKguEdsklx7vvFhyQcNCOLYwX_0F8LcPbg6rfKJnAo';

const supabase = createClient(supabaseUrl, supabaseKey);

const TEST_USER_ID = 'f92e7cec-391a-486c-a474-bac5f240fe58';

async function testCreateMarketOrder() {
  console.log('🧪 直接测试 create_market_order RPC 函数\n');
  
  const orderId = randomUUID();
  const params = {
    p_seller_id: TEST_USER_ID,
    p_order_id: orderId,
    p_rarity: 'gold',
    p_quantity: 5,
    p_price_coins: 500
  };
  
  console.log('📤 参数:');
  console.log(JSON.stringify(params, null, 2));
  console.log('');
  
  try {
    const { data, error } = await supabase.rpc('create_market_order', params);
    
    if (error) {
      console.error('❌ RPC 调用失败:');
      console.error('  错误码:', error.code);
      console.error('  错误信息:', error.message);
      console.error('  详细信息:', error.details);
      console.error('  提示:', error.hint);
      console.error('  完整错误:', JSON.stringify(error, null, 2));
    } else {
      console.log('✅ RPC 调用成功!');
      console.log('📥 返回数据:');
      console.log(JSON.stringify(data, null, 2));
      
      if (data.success) {
        console.log('\n🎉 订单创建成功!');
        console.log(`订单 ID: ${data.orderId}`);
      } else {
        console.log('\n⚠️  订单创建失败:');
        console.log(`错误: ${data.error}`);
        if (data.message) console.log(`详情: ${data.message}`);
      }
    }
  } catch (err) {
    console.error('❌ 异常:', err);
  }
}

testCreateMarketOrder();
