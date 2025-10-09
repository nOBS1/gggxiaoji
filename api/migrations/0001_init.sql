-- ==================== 数据库初始化迁移 ====================
-- 版本: 0001
-- 描述: 创建所有核心表
-- 作者: AI Assistant
-- 日期: 2025-10-08

-- ==================== 用户表 ====================
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  hashed_password TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  last_login INTEGER,
  is_active INTEGER DEFAULT 1,
  is_verified INTEGER DEFAULT 0
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);

-- ==================== 用户资料表 ====================
CREATE TABLE IF NOT EXISTS profiles (
  user_id TEXT PRIMARY KEY,
  nickname TEXT NOT NULL,
  avatar TEXT,
  coins INTEGER DEFAULT 0,
  sound_enabled INTEGER DEFAULT 1,
  language TEXT DEFAULT 'zh',
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_profiles_nickname ON profiles(nickname);

-- ==================== 库存表 ====================
CREATE TABLE IF NOT EXISTS inventory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  rarity TEXT NOT NULL CHECK(rarity IN ('white', 'brown', 'silver', 'gold', 'purple', 'black')),
  quantity INTEGER DEFAULT 0,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, rarity)
);

CREATE INDEX idx_inventory_user ON inventory(user_id);
CREATE INDEX idx_inventory_rarity ON inventory(rarity);

-- ==================== 升级表 ====================
CREATE TABLE IF NOT EXISTS upgrades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  upgrade_key TEXT NOT NULL CHECK(upgrade_key IN ('level', 'feed', 'clickPower', 'idleRate', 'luckyChance', 'autoSell', 'goldBonus')),
  level INTEGER DEFAULT 0,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, upgrade_key)
);

CREATE INDEX idx_upgrades_user ON upgrades(user_id);

-- ==================== 游戏统计表 ====================
CREATE TABLE IF NOT EXISTS stats (
  user_id TEXT PRIMARY KEY,
  peck_progress INTEGER DEFAULT 0,
  idle_accumulator REAL DEFAULT 0,
  last_idle_tick INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  total_clicks INTEGER DEFAULT 0,
  total_eggs_sold INTEGER DEFAULT 0,
  black_pity_counter INTEGER DEFAULT 0,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==================== 每日任务表 ====================
CREATE TABLE IF NOT EXISTS daily_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  task_key TEXT NOT NULL CHECK(task_key IN ('daily_click', 'daily_sell')),
  progress INTEGER DEFAULT 0,
  claimed INTEGER DEFAULT 0,
  date TEXT NOT NULL,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, task_key, date)
);

CREATE INDEX idx_daily_tasks_user_date ON daily_tasks(user_id, date);

-- ==================== 广告记录表 ====================
CREATE TABLE IF NOT EXISTS ad_runs (
  user_id TEXT PRIMARY KEY,
  cooldown INTEGER DEFAULT 0,
  watched_today INTEGER DEFAULT 0,
  last_date TEXT,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==================== 订单表（交易系统） ====================
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL,
  rarity TEXT NOT NULL CHECK(rarity IN ('white', 'brown', 'silver', 'gold', 'purple', 'black')),
  quantity INTEGER NOT NULL,
  price_coins INTEGER NOT NULL,
  status TEXT DEFAULT 'open' CHECK(status IN ('open', 'sold', 'cancelled')),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_orders_seller ON orders(seller_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_rarity ON orders(rarity);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- ==================== 交易记录表 ====================
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  buyer_id TEXT NOT NULL,
  seller_id TEXT NOT NULL,
  order_id TEXT NOT NULL,
  rarity TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price_total INTEGER NOT NULL,
  fee INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE INDEX idx_transactions_buyer ON transactions(buyer_id);
CREATE INDEX idx_transactions_seller ON transactions(seller_id);
CREATE INDEX idx_transactions_order ON transactions(order_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);

-- ==================== 初始化触发器 ====================

-- 用户创建时自动创建关联记录
CREATE TRIGGER IF NOT EXISTS after_user_insert
AFTER INSERT ON users
BEGIN
  -- 创建用户资料
  INSERT INTO profiles (user_id, nickname)
  VALUES (NEW.id, substr(NEW.email, 1, instr(NEW.email, '@') - 1));
  
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
END;

-- ==================== 完成 ====================
-- 迁移完成，表结构已创建
