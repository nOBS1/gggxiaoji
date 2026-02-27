// Add test eggs to a user's inventory
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function addTestEggs() {
  // Get user nickname from command line argument, or list all users
  const userNickname = process.argv[2];
  
  // List all profiles
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('user_id, nickname, coins');
  
  if (profileError) {
    console.error('❌ Error fetching profiles:', profileError);
    return;
  }
  
  console.log('📋 Available profiles:');
  profiles.forEach((p, idx) => {
    console.log(`  ${idx + 1}. ${p.nickname} - ${p.coins} coins - ${p.user_id}`);
  });
  
  // Find user by nickname or use first user
  let targetUser;
  if (userNickname) {
    targetUser = profiles.find(p => p.nickname === userNickname);
    if (!targetUser) {
      console.error(`\n❌ User with nickname "${userNickname}" not found`);
      console.log('💡 Try running: node add-test-eggs.js <nickname>');
      return;
    }
  } else {
    targetUser = profiles[0];
    console.log(`\n💡 No nickname provided, using first user: ${targetUser.nickname}`);
  }
  
  const userId = targetUser.user_id;
  console.log(`\n✅ Using user: ${targetUser.nickname} (${userId})`);
  
  // Check current inventory
  const { data: inventory, error: invError } = await supabase
    .from('inventory')
    .select('rarity, quantity')
    .eq('user_id', userId);
  
  console.log('\n📦 Current inventory:');
  inventory?.forEach(item => {
    console.log(`  ${item.rarity}: ${item.quantity}`);
  });
  
  // Add test eggs
  console.log('\n➕ Adding 10 brown eggs and 5 white eggs...');
  
  const { error: brownError } = await supabase
    .from('inventory')
    .update({ quantity: 10 })
    .eq('user_id', userId)
    .eq('rarity', 'brown');
  
  if (brownError) {
    console.error('❌ Error adding brown eggs:', brownError);
  } else {
    console.log('✅ Added 10 brown eggs');
  }
  
  const { error: whiteError } = await supabase
    .from('inventory')
    .update({ quantity: 5 })
    .eq('user_id', userId)
    .eq('rarity', 'white');
  
  if (whiteError) {
    console.error('❌ Error adding white eggs:', whiteError);
  } else {
    console.log('✅ Added 5 white eggs');
  }
  
  // Show updated inventory
  const { data: updatedInv } = await supabase
    .from('inventory')
    .select('rarity, quantity')
    .eq('user_id', userId);
  
  console.log('\n📦 Updated inventory:');
  updatedInv?.forEach(item => {
    console.log(`  ${item.rarity}: ${item.quantity}`);
  });
  
  console.log('\n✅ Done! You can now try creating market orders.');
}

addTestEggs();
