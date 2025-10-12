/*
 * 国际化模块
 */
export const i18n = {
  zh: {
    // 基础
    eggs: '鸡蛋', coins: '金币', level: '等级', feed: '饲料',
    totalEggs: '总蛋数', chickenLevel: '小鸡等级',
    feedNormal: '普通', feedAdvanced: '高级', feedPremium: '顶级',
    title: '🐔 鸡蛋模拟器',
    
    // 标签页
    tabMain: '🎮 主界面', tabInventory: '🎒 背包', tabShop: '🏪 商店', 
    tabUpgrade: '⬆️ 升级', tabTasks: '📋 任务', tabSettings: '⚙️ 设置',
    
    // 主界面
    clickHint: '点击小鸡产蛋！',
    gameTitle: '点击小鸡啄米产蛋！', 
    idleRate: '被动产蛋', 
    clickPower: '点击力', 
    progress: '进度',
    
    // 稀有度
    rarityWhite: '白蛋', rarityBrown: '棕蛋', raritySilver: '银蛋', 
    rarityGold: '金蛋', rarityPurple: '紫蛋', rarityBlack: '黑蛋',
    
    // 背包
    myInventory: '我的背包', 
    inventoryTitle: '🎒 鸡蛋背包', 
    value: '价值', 
    stock: '库存',
    
    // 商店
    shop: '商店',
    shopTitle: '🏪 卖蛋商店', 
    shopDesc: '出售你的蛋换取金币', 
    price: '售价', 
    sellOne: '卖出 1 个', 
    sellTen: '卖出 10 个',
    
    // 升级
    upgradeTitle: '升级小鸡',
    upgradeSubtitle: '使用蛋提升小鸡能力',
    upgradeName: { 
      level: '小鸡等级', 
      feed: '饲料品质', 
      clickPower: '强力啄', 
      idleRate: '被动效率',
      luckyChance: '幸运加成',
      autoSell: '自动售卖',
      goldBonus: '金币加成'
    },
    upgradeDesc: { 
      level: '提升稀有蛋掉落概率', 
      feed: '提升高级蛋掉落权重', 
      clickPower: '每次点击增加更多进度', 
      idleRate: '提升每分钟产蛋速度',
      luckyChance: '提升所有稀有蛋掉落率',
      autoSell: '每分钟自动售卖白蛋',
      goldBonus: '卖蛋获得更多金币'
    },
    current: '当前', currentLevel: '当前等级', perClick: '每次点击', eggsPerMin: '蛋/分钟', 
    rareDrop: '稀有掉落', coinGain: '金币获得',
    upgrade: '升级', maxLevel: '已满级',
    
    // 任务
    tasksTitle: '每日任务',
    tasksDesc: '完成任务获得奖励',
    taskDailyClick: '每日点击任务', 
    taskDailyClickDesc: '今日点击小鸡 100 次', 
    taskDailySell: '每日卖蛋任务', 
    taskDailySellDesc: '卖出 3 枚银蛋', 
    taskProgress: '进度', 
    reward: '奖励', 
    claim: '领取', 
    incomplete: '未完成',
    
    // 广告
    adTitle: '广告奖励',
    adDesc: '观看30秒广告获得5个白蛋',
    watchAd: '观看广告', 
    cooldown: '冷却时间',
    adPlaying: '广告播放中...',
    
    // 设置
    settingsTitle: '设置',
    soundEffects: '音效',
    language: '语言',
    saveManagement: '存档管理',
    exportSave: '导出存档', 
    importSave: '导入存档', 
    resetGame: '重置游戏',
    about: '关于游戏',
    version: '版本',
    developer: '开发者',
    description: '说明',
    gameDescription: '一款轻度挂机放置类游戏',
    
    // 通用
    dropRare: '恭喜获得稀有蛋！', 
    offlineEarned: '离线获得', 
    auto: '自动', 
    importSuccess: '导入成功！', 
    importFailed: '导入失败：文件格式错误', 
    resetConfirm: '确定要重置游戏吗？所有进度将被清除！',
    
    // 公告
    announcementMain: '欢迎来到小游戏·小鸡生蛋！点击小鸡开始你的养鸡之旅！',
    
    // 更新日志
    changelog: '更新日志',
    changelogV210Item1: '✨ 添加真实音效系统，体验更佳',
    changelogV210Item2: '🐔 替换为真实小鸡和鸡蛋图片',
    changelogV210Item3: '🌍 优化国际化支持，流畅切换中英文',
    changelogV210Item4: '📱 修复移动端小鸡图片显示问题',
    changelogV210Item5: '📢 新增公告系统，及时了解游戏动态',
    changelogV200Item1: '🎉 全新界面设计，更加美观',
    changelogV200Item2: '⬆️ 添加更多升级选项',
    changelogV200Item3: '🎯 新增每日任务系统',
    changelogV200Item4: '💾 优化存档系统',
    
    // 游戏指南
    gameGuide: '游戏指南',
    guideBasic: '🐣 基本玩法',
    guideBasicDesc: '点击小鸡积累进度，达到 100% 后产出鸡蛋。收集不同稀有度的鸡蛋，出售换取金币。',
    guideUpgrade: '⬆️ 升级系统',
    guideUpgradeDesc: '使用鸡蛋或金币升级小鸡能力，提升点击效率、被动产蛋速度和稀有蛋掉落率。',
    guideTasks: '🎯 任务系统',
    guideTasksDesc: '每日完成任务可获得额外奖励，别忘记领取哦！',
    
    // 市场交易
    market: '🛒 市场',
    marketPlace: '市场广场',
    myOrders: '我的订单',
    transactions: '交易记录',
    createOrder: '创建订单',
    buyNow: '立即购买',
    cancel: '取消',
    seller: '卖家',
    quantity: '数量',
    totalPrice: '总价',
    unitPrice: '单价',
    fee: '手续费',
    activeOrders: '活跃订单',
    completedTrades: '完成交易',
    totalVolume: '总交易量',
    tradingFee: '交易手续费',
    noOrdersAvailable: '暂无订单',
    noMyOrders: '您还没有创建订单',
    noTransactions: '暂无交易记录',
    orderCreated: '订单创建成功',
    purchaseSuccess: '购买成功',
    orderCancelled: '订单已取消',
    insufficientInventory: '库存不足',
    insufficientInventoryDetail: '库存不足！当前: {current}个，需要: {required}个',
    insufficientCoins: '金币不足',
    insufficientCoinsDetail: '金币不足！当前: {current}💰，需要: {required}💰',
    orderNotAvailable: '订单已失效',
    cannotBuyOwnOrder: '不能购买自己的订单',
    notTradable: '该类型的蛋不可交易，只能交易紫蛋、金蛋和黑蛋',
    invalidInput: '输入无效',
    tooManyOrders: '挂单数量已达上限',
    pleaseLogin: '请先登录',
    bought: '买入',
    sold: '卖出',
    from: '从',
    to: '给',
    status_open: '待售',
    status_sold: '已售',
    status_cancelled: '已取消',
    egg_white: '白蛋',
    egg_brown: '棕蛋',
    egg_silver: '银蛋',
    egg_gold: '金蛋',
    egg_purple: '紫蛋',
    egg_black: '黑蛋',
    rarity: '稀有度',
    youWillReceive: '您将收到',
    listingPrice: '挂单价格',
    platformFee: '平台手续费',
    feeHint: '手续费用于维持市场运营',
    searchPlaceholder: '搜索卖家昵称...',
    priceFilter: '价格筛选',
    allPrices: '全部价格',
    minPrice: '最低价',
    maxPrice: '最高价',
    apply: '应用',
    searchResults: '搜索结果',
    noSearchResults: '没有找到匹配的订单',
    
    // 认证系统
    login: '登录',
    register: '注册',
    logout: '退出登录',
    profile: '个人中心',
    email: '邮箱地址',
    password: '密码',
    confirmPassword: '确认密码',
    rememberMe: '记住我',
    forgotPassword: '忘记密码？',
    loginButton: '登录',
    registerButton: '注册账号',
    guestMode: '游客模式',
    authTitle: '欢迎来到小鸡生蛋',
    authSubtitle: '使用您的账号登录或注册以同步游戏进度',
    orLoginWith: '或使用以下方式登录',
    orRegisterWith: '或使用以下方式注册',
    noAccount: '还没有账号？',
    registerLink: '立即注册',
    hasAccount: '已有账号？',
    loginLink: '立即登录',
    passwordStrength: '密码强度'
  },
  en: {
    // Basic
    eggs: 'Eggs', coins: 'Coins', level: 'Level', feed: 'Feed',
    totalEggs: 'Total Eggs', chickenLevel: 'Chicken Level',
    feedNormal: 'Normal', feedAdvanced: 'Advanced', feedPremium: 'Premium',
    title: '🐔 Egg Simulator',
    
    // Tabs
    tabMain: '🎮 Main', tabInventory: '🎒 Inventory', tabShop: '🏪 Shop', 
    tabUpgrade: '⬆️ Upgrade', tabTasks: '📋 Tasks', tabSettings: '⚙️ Settings',
    
    // Main
    clickHint: 'Click the chicken to lay eggs!',
    gameTitle: 'Click the chicken to peck and lay eggs!', 
    idleRate: 'Passive Rate', 
    clickPower: 'Click Power', 
    progress: 'Progress',
    
    // Rarity
    rarityWhite: 'White Egg', rarityBrown: 'Brown Egg', raritySilver: 'Silver Egg', 
    rarityGold: 'Gold Egg', rarityPurple: 'Purple Egg', rarityBlack: 'Black Egg',
    
    // Inventory
    myInventory: 'My Inventory', 
    inventoryTitle: '🎒 Egg Inventory', 
    value: 'Value', 
    stock: 'Stock',
    
    // Shop
    shop: 'Shop',
    shopTitle: '🏪 Egg Shop', 
    shopDesc: 'Sell your eggs for coins', 
    price: 'Price', 
    sellOne: 'Sell 1', 
    sellTen: 'Sell 10',
    
    // Upgrade
    upgradeTitle: 'Upgrade Chicken',
    upgradeSubtitle: 'Use eggs to boost abilities',
    upgradeName: { 
      level: 'Chicken Level', 
      feed: 'Feed Quality', 
      clickPower: 'Power Peck', 
      idleRate: 'Idle Efficiency',
      luckyChance: 'Lucky Bonus',
      autoSell: 'Auto Sell',
      goldBonus: 'Coin Bonus'
    },
    upgradeDesc: { 
      level: 'Increase rare egg drop rate', 
      feed: 'Boost high-tier egg weight', 
      clickPower: 'Gain more progress per click', 
      idleRate: 'Increase eggs per minute',
      luckyChance: 'Boost all rare egg drop rates',
      autoSell: 'Auto sell white eggs per minute',
      goldBonus: 'Get more coins from selling'
    },
    current: 'Current', currentLevel: 'Current Level', perClick: 'per click', eggsPerMin: 'eggs/min', 
    rareDrop: 'rare drop', coinGain: 'coin gain',
    upgrade: 'Upgrade', maxLevel: 'MAX',
    
    // Tasks
    tasksTitle: 'Daily Tasks',
    tasksDesc: 'Complete tasks for rewards',
    taskDailyClick: 'Daily Click Quest', 
    taskDailyClickDesc: 'Click chicken 100 times today', 
    taskDailySell: 'Daily Sell Quest', 
    taskDailySellDesc: 'Sell 3 silver eggs', 
    taskProgress: 'Progress', 
    reward: 'Reward', 
    claim: 'Claim', 
    incomplete: 'Incomplete',
    
    // Ads
    adTitle: 'Ad Rewards',
    adDesc: 'Watch a 30s ad to get 5 white eggs',
    watchAd: 'Watch Ad', 
    cooldown: 'Cooldown',
    adPlaying: 'Ad playing...',
    
    // Settings
    settingsTitle: 'Settings',
    soundEffects: 'Sound Effects',
    language: 'Language',
    saveManagement: 'Save Management',
    exportSave: 'Export Save', 
    importSave: 'Import Save', 
    resetGame: 'Reset Game',
    about: 'About',
    version: 'Version',
    developer: 'Developer',
    description: 'Description',
    gameDescription: 'A casual idle clicker game',
    
    // General
    dropRare: 'Congratulations on the rare egg!', 
    offlineEarned: 'Offline earned', 
    auto: 'Auto', 
    importSuccess: 'Import successful!', 
    importFailed: 'Import failed: Invalid file format', 
    resetConfirm: 'Are you sure you want to reset the game? All progress will be lost!',
    
    // Announcement
    announcementMain: 'Welcome to Chicken Egg Laying Game! Click the chicken to start your journey!',
    
    // Changelog
    changelog: 'Changelog',
    changelogV210Item1: '✨ Added real sound effects for better experience',
    changelogV210Item2: '🐔 Replaced with real chicken and egg images',
    changelogV210Item3: '🌍 Optimized i18n support with smooth language switching',
    changelogV210Item4: '📱 Fixed mobile chicken image display issue',
    changelogV210Item5: '📢 Added announcement system for game updates',
    changelogV200Item1: '🎉 Brand new UI design',
    changelogV200Item2: '⬆️ Added more upgrade options',
    changelogV200Item3: '🎯 Added daily task system',
    changelogV200Item4: '💾 Optimized save system',
    
    // Game Guide
    gameGuide: 'Game Guide',
    guideBasic: '🐣 Basic Gameplay',
    guideBasicDesc: 'Click the chicken to accumulate progress. When reaching 100%, an egg is laid. Collect eggs of different rarities and sell them for coins.',
    guideUpgrade: '⬆️ Upgrade System',
    guideUpgradeDesc: 'Use eggs or coins to upgrade chicken abilities, improving click efficiency, idle egg rate, and rare egg drop rate.',
    guideTasks: '🎯 Task System',
    guideTasksDesc: 'Complete daily tasks for extra rewards. Don\'t forget to claim them!',
    
    // Market Trading
    market: '🛒 Market',
    marketPlace: 'Marketplace',
    myOrders: 'My Orders',
    transactions: 'Transactions',
    createOrder: 'Create Order',
    buyNow: 'Buy Now',
    cancel: 'Cancel',
    seller: 'Seller',
    quantity: 'Quantity',
    totalPrice: 'Total Price',
    unitPrice: 'Unit Price',
    fee: 'Fee',
    activeOrders: 'Active Orders',
    completedTrades: 'Completed Trades',
    totalVolume: 'Total Volume',
    tradingFee: 'Trading Fee',
    noOrdersAvailable: 'No orders available',
    noMyOrders: 'You have no orders yet',
    noTransactions: 'No transactions yet',
    orderCreated: 'Order created successfully',
    purchaseSuccess: 'Purchase successful',
    orderCancelled: 'Order cancelled',
    insufficientInventory: 'Insufficient inventory',
    insufficientInventoryDetail: 'Insufficient inventory! Current: {current}, Required: {required}',
    insufficientCoins: 'Insufficient coins',
    insufficientCoinsDetail: 'Insufficient coins! Current: {current}💰, Required: {required}💰',
    orderNotAvailable: 'Order not available',
    cannotBuyOwnOrder: 'Cannot buy your own order',
    notTradable: 'This egg type cannot be traded. Only purple, gold, and black eggs are tradable.',
    invalidInput: 'Invalid input',
    tooManyOrders: 'Too many orders',
    pleaseLogin: 'Please login first',
    bought: 'Bought',
    sold: 'Sold',
    from: 'from',
    to: 'to',
    status_open: 'Open',
    status_sold: 'Sold',
    status_cancelled: 'Cancelled',
    egg_white: 'White Egg',
    egg_brown: 'Brown Egg',
    egg_silver: 'Silver Egg',
    egg_gold: 'Gold Egg',
    egg_purple: 'Purple Egg',
    egg_black: 'Black Egg',
    rarity: 'Rarity',
    youWillReceive: 'You will receive',
    listingPrice: 'Listing Price',
    platformFee: 'Platform Fee',
    feeHint: 'Fee is used to maintain market operations',
    searchPlaceholder: 'Search seller...',
    priceFilter: 'Price Filter',
    allPrices: 'All Prices',
    minPrice: 'Min Price',
    maxPrice: 'Max Price',
    apply: 'Apply',
    searchResults: 'Search Results',
    noSearchResults: 'No matching orders found',
    
    // Authentication
    login: 'Login',
    register: 'Register',
    logout: 'Logout',
    profile: 'Profile',
    email: 'Email Address',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    rememberMe: 'Remember me',
    forgotPassword: 'Forgot password?',
    loginButton: 'Login',
    registerButton: 'Register Account',
    guestMode: 'Guest Mode',
    authTitle: 'Welcome to Chicken Egg Game',
    authSubtitle: 'Login or register to sync your game progress',
    orLoginWith: 'Or login with',
    orRegisterWith: 'Or register with',
    noAccount: 'Don\'t have an account?',
    registerLink: 'Register now',
    hasAccount: 'Already have an account?',
    loginLink: 'Login now',
    passwordStrength: 'Password Strength'
  }
};

export function t(i18nObj, lang, key, params = {}) {
  const keys = key.split('.');
  let v = i18nObj[lang];
  for (const k of keys) {
    if (v && v[k] !== undefined) v = v[k]; else return key;
  }
  
  // 替换模板变量 {key} 为实际值
  if (typeof v === 'string' && Object.keys(params).length > 0) {
    Object.keys(params).forEach(paramKey => {
      const regex = new RegExp(`\\{${paramKey}\\}`, 'g');
      v = v.replace(regex, params[paramKey]);
    });
  }
  
  return v;
}
