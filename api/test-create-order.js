// Test script to diagnose create_market_order RPC error
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCreateOrder() {
  console.log('🧪 Testing create_market_order RPC function...\n');
  
  // First, get a test user
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('user_id, coins, nickname')
    .limit(1);
  
  if (profileError || !profiles || profiles.length === 0) {
    console.error('❌ Failed to get test user:', profileError);
    return;
  }
  
  const testUser = profiles[0];
  console.log('👤 Test User:', testUser);
  
  // Check user's inventory
  const { data: inventory, error: invError } = await supabase
    .from('inventory')
    .select('rarity, quantity')
    .eq('user_id', testUser.user_id);
  
  console.log('\n📦 User Inventory:', inventory);
  
  // Try to create an order
  const testOrderId = crypto.randomUUID();
  const testParams = {
    p_seller_id: testUser.user_id,
    p_order_id: testOrderId,
    p_rarity: 'brown',
    p_quantity: 2,
    p_price_coins: 200
  };
  
  console.log('\n📝 Testing with params:', testParams);
  
  const { data, error } = await supabase.rpc('create_market_order', testParams);
  
  if (error) {
    console.error('\n❌ RPC Error:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
  } else {
    console.log('\n✅ RPC Response:', JSON.stringify(data, null, 2));
  }
}

testCreateOrder();
