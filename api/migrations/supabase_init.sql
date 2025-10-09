-- ==================== 小鸡点击游戏 - Supabase PostgreSQL Schema ====================
-- 版本: 1.0
-- 数据库: PostgreSQL (Supabase)
-- 日期: 2025-10-08

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== 用户表 ====================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  hashed_password TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- ==================== 用户资料表 ====================
CREATE TABLE IF NOT EXISTS profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  avatar TEXT,
  coins INTEGER DEFAULT 0,
  sound_enabled BOOLEAN DEFAULT true,
  language TEXT DEFAULT 'zh',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_nickname ON profiles(nickname);

-- ==================== 库存表 ====================
CREATE TABLE IF NOT EXISTS inventory (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rarity TEXT NOT NULL CHECK(rarity IN ('white', 'brown', 'silver', 'gold', 'purple', 'black')),
  quantity INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, rarity)
);

CREATE INDEX IF NOT EXISTS idx_inventory_user ON inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_rarity ON inventory(rarity);

-- ==================== 升级表 ====================
CREATE TABLE IF NOT EXISTS upgrades (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  upgrade_key TEXT NOT NULL CHECK(upgrade_key IN ('level', 'feed', 'clickPower', 'idleRate', 'luckyChance', 'autoSell', 'goldBonus')),
  level INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, upgrade_key)
);

CREATE INDEX IF NOT EXISTS idx_upgrades_user ON upgrades(user_id);

-- ==================== 游戏统计表 ====================
CREATE TABLE IF NOT EXISTS stats (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  peck_progress INTEGER DEFAULT 0,
  idle_accumulator DOUBLE PRECISION DEFAULT 0,
  last_idle_tick BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT * 1000,
  total_clicks INTEGER DEFAULT 0,
  total_eggs_sold INTEGER DEFAULT 0,
  black_pity_counter INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==================== 每日任务表 ====================
CREATE TABLE IF NOT EXISTS daily_tasks (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_key TEXT NOT NULL CHECK(task_key IN ('daily_click', 'daily_sell')),
  progress INTEGER DEFAULT 0,
  claimed BOOLEAN DEFAULT false,
  date DATE NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, task_key, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_tasks_user_date ON daily_tasks(user_id, date);

-- ==================== 广告记录表 ====================
CREATE TABLE IF NOT EXISTS ad_runs (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  cooldown INTEGER DEFAULT 0,
  watched_today INTEGER DEFAULT 0,
  last_date DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==================== 订单表（交易系统） ====================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rarity TEXT NOT NULL CHECK(rarity IN ('white', 'brown', 'silver', 'gold', 'purple', 'black')),
  quantity INTEGER NOT NULL,
  price_coins INTEGER NOT NULL,
  status TEXT DEFAULT 'open' CHECK(status IN ('open', 'sold', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_seller ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_rarity ON orders(rarity);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- ==================== 交易记录表 ====================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  rarity TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price_total INTEGER NOT NULL,
  fee INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_buyer ON transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_seller ON transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_transactions_order ON transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);

-- ==================== 触发器函数 ====================

-- 自动更新 updated_at 时间戳
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为需要的表添加触发器
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_upgrades_updated_at BEFORE UPDATE ON upgrades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stats_updated_at BEFORE UPDATE ON stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_tasks_updated_at BEFORE UPDATE ON daily_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ad_runs_updated_at BEFORE UPDATE ON ad_runs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================== 用户注册时自动创建关联记录的函数 ====================

CREATE OR REPLACE FUNCTION create_user_initial_data()
RETURNS TRIGGER AS $$
BEGIN
  -- 创建用户资料
  INSERT INTO profiles (user_id, nickname)
  VALUES (NEW.id, SPLIT_PART(NEW.email, '@', 1));
  
  -- 创建游戏统计
  INSERT INTO stats (user_id)
  VALUES (NEW.id);
  
  -- 创建广告记录
  INSERT INTO ad_runs (user_id)
  VALUES (NEW.id);
  
  -- 初始化库存（所有稀有度为0）
  INSERT INTO inventory (user_id, rarity, quantity) VALUES
    (NEW.id, 'white', 0),
    (NEW.id, 'brown', 0),
    (NEW.id, 'silver', 0),
    (NEW.id, 'gold', 0),
    (NEW.id, 'purple', 0),
    (NEW.id, 'black', 0);
  
  -- 初始化升级（所有升级为0，level为1）
  INSERT INTO upgrades (user_id, upgrade_key, level) VALUES
    (NEW.id, 'level', 1),
    (NEW.id, 'feed', 0),
    (NEW.id, 'clickPower', 0),
    (NEW.id, 'idleRate', 0),
    (NEW.id, 'luckyChance', 0),
    (NEW.id, 'autoSell', 0),
    (NEW.id, 'goldBonus', 0);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
CREATE TRIGGER after_user_insert
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION create_user_initial_data();

-- ==================== Row Level Security (RLS) 策略 ====================

-- 启用 RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE upgrades ENABLE ROW LEVEL SECURITY;
ALTER TABLE stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- profiles 策略
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- inventory 策略
CREATE POLICY "Users can view their own inventory"
  ON inventory FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own inventory"
  ON inventory FOR UPDATE
  USING (auth.uid() = user_id);

-- upgrades 策略
CREATE POLICY "Users can view their own upgrades"
  ON upgrades FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own upgrades"
  ON upgrades FOR UPDATE
  USING (auth.uid() = user_id);

-- stats 策略
CREATE POLICY "Users can view their own stats"
  ON stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats"
  ON stats FOR UPDATE
  USING (auth.uid() = user_id);

-- orders 策略（所有人可以看，只有卖家可以修改）
CREATE POLICY "Anyone can view open orders"
  ON orders FOR SELECT
  USING (status = 'open');

CREATE POLICY "Sellers can manage their orders"
  ON orders FOR ALL
  USING (auth.uid() = seller_id);

-- transactions 策略（买家和卖家都可以查看）
CREATE POLICY "Users can view their transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- ==================== 完成 ====================
-- Supabase PostgreSQL Schema 创建完成！
