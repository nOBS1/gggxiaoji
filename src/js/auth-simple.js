/**
 * 认证系统 JavaScript - 简化版
 * 适配当前的HTML结构
 */
import { CONFIG } from './config.js';
import { state, saveGame } from './state.js';
import { updateAllDisplays } from './ui.js';

const CLOUD_REFRESH_INTERVAL_MS = 60000;

let cloudRefreshHandlerRegistered = false;
let cloudRefreshIntervalId = null;
let cloudFocusHandler = null;
let cloudVisibilityHandler = null;
let isRefreshingCloudState = false;

function getStoredAuthToken() {
  return (
    localStorage.getItem('auth_token') ||
    sessionStorage.getItem('auth_token') ||
    null
  );
}

// ==================== 工具函数 ====================

// 显示 Toast 提示
export function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  const toastIcon = document.getElementById('toastIcon');
  const toastMessage = document.getElementById('toastMessage');
  
  if (!toast) {
    console.warn('Toast element not found');
    alert(message);
    return;
  }
  
  toast.className = `toast ${type}`;
  toastIcon.textContent = type === 'success' ? '✓' : '✗';
  toastMessage.textContent = message;
  toast.style.display = 'flex';
  
  setTimeout(() => {
    toast.style.display = 'none';
  }, 3000);
}

// 验证邮箱格式
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// 验证密码强度
function checkPasswordStrength(password) {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[^a-zA-Z\d]/.test(password)) strength++;
  
  if (strength <= 2) return { level: 'weak', text: '弱' };
  if (strength <= 3) return { level: 'medium', text: '中等' };
  return { level: 'strong', text: '强' };
}

// ==================== 认证模态框管理 ====================

// 打开认证模态框
export function openAuthModal(defaultTab = 'login') {
  const authModal = document.getElementById('authModal');
  if (!authModal) {
    console.error('Auth modal not found');
    return;
  }
  
  authModal.classList.add('active');
  document.body.style.overflow = 'hidden';
  switchAuthTab(defaultTab);
}

// 关闭认证模态框
export function closeAuthModal() {
  const authModal = document.getElementById('authModal');
  if (!authModal) return;
  
  authModal.classList.remove('active');
  document.body.style.overflow = '';
}

// 切换登录/注册标签
function switchAuthTab(tab) {
  const tabs = document.querySelectorAll('.auth-tab');
  const forms = document.querySelectorAll('.auth-form');
  
  tabs.forEach(t => {
    if (t.dataset.tab === tab) {
      t.classList.add('active');
    } else {
      t.classList.remove('active');
    }
  });
  
  forms.forEach(f => {
    if (f.id === `${tab}Form`) {
      f.classList.add('active');
    } else {
      f.classList.remove('active');
    }
  });
  
  // 更新标题
  const authTitle = document.querySelector('.auth-title');
  const authSubtitle = document.querySelector('.auth-subtitle');
  if (authTitle && authSubtitle) {
    if (tab === 'login') {
      authTitle.textContent = '欢迎回来';
      authSubtitle.textContent = '登录以同步您的游戏进度';
    } else {
      authTitle.textContent = '创建账号';
      authSubtitle.textContent = '注册以保存您的游戏进度';
    }
  }
}

// ==================== 密码显示/隐藏切换 ====================

function setupPasswordToggles() {
  const toggleBtns = document.querySelectorAll('.password-toggle');
  
  toggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const input = document.getElementById(targetId);
      
      if (!input) return;
      
      if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '🙈';
      } else {
        input.type = 'password';
        btn.textContent = '👁️';
      }
    });
  });
}

// ==================== 密码强度指示器 ====================

function setupPasswordStrengthIndicator() {
  const passwordInput = document.getElementById('registerPassword');
  const strengthDiv = document.getElementById('passwordStrength');
  
  if (!passwordInput || !strengthDiv) return;
  
  const strengthFill = strengthDiv.querySelector('.strength-fill');
  const strengthText = strengthDiv.querySelector('.strength-text span');
  
  if (!strengthFill || !strengthText) return;
  
  passwordInput.addEventListener('input', () => {
    const password = passwordInput.value;
    
    if (password.length === 0) {
      strengthDiv.classList.remove('show');
      return;
    }
    
    strengthDiv.classList.add('show');
    const { level, text } = checkPasswordStrength(password);
    
    strengthFill.className = `strength-fill ${level}`;
    strengthText.textContent = text;
  });
}

// ==================== 表单验证 ====================

function validateLoginForm() {
  const email = document.getElementById('loginEmail')?.value.trim();
  const password = document.getElementById('loginPassword')?.value;
  
  let isValid = true;
  
  // 验证邮箱
  const emailError = document.getElementById('loginEmailError');
  const emailInput = document.getElementById('loginEmail');
  if (!email || !validateEmail(email)) {
    emailError?.classList.add('show');
    emailInput?.classList.add('error');
    isValid = false;
  } else {
    emailError?.classList.remove('show');
    emailInput?.classList.remove('error');
  }
  
  // 验证密码
  const passwordError = document.getElementById('loginPasswordError');
  const passwordInput = document.getElementById('loginPassword');
  if (!password || password.length < 6) {
    if (passwordError) passwordError.textContent = '密码至少6个字符';
    passwordError?.classList.add('show');
    passwordInput?.classList.add('error');
    isValid = false;
  } else {
    passwordError?.classList.remove('show');
    passwordInput?.classList.remove('error');
  }
  
  return isValid;
}

function validateRegisterForm() {
  const email = document.getElementById('registerEmail')?.value.trim();
  const password = document.getElementById('registerPassword')?.value;
  const confirmPassword = document.getElementById('confirmPassword')?.value;
  const agreeTerms = document.getElementById('agreeTerms')?.checked;
  
  let isValid = true;
  
  // 验证邮箱
  const emailError = document.getElementById('registerEmailError');
  const emailInput = document.getElementById('registerEmail');
  if (!email || !validateEmail(email)) {
    emailError?.classList.add('show');
    emailInput?.classList.add('error');
    isValid = false;
  } else {
    emailError?.classList.remove('show');
    emailInput?.classList.remove('error');
  }
  
  // 验证密码
  const passwordError = document.getElementById('registerPasswordError');
  const passwordInput = document.getElementById('registerPassword');
  if (!password || password.length < 8) {
    if (passwordError) passwordError.textContent = '密码至少8个字符';
    passwordError?.classList.add('show');
    passwordInput?.classList.add('error');
    isValid = false;
  } else {
    passwordError?.classList.remove('show');
    passwordInput?.classList.remove('error');
  }
  
  // 验证确认密码
  const confirmError = document.getElementById('confirmPasswordError');
  const confirmInput = document.getElementById('confirmPassword');
  if (password !== confirmPassword) {
    confirmError?.classList.add('show');
    confirmInput?.classList.add('error');
    isValid = false;
  } else {
    confirmError?.classList.remove('show');
    confirmInput?.classList.remove('error');
  }
  
  // 验证用户协议
  if (!agreeTerms) {
    showToast('请阅读并同意用户协议', 'error');
    isValid = false;
  }
  
  return isValid;
}

// ==================== 同步本地数据到服务器 ====================

const SYNC_RARITY_KEYS = Object.keys(CONFIG.RARITIES || {});
const SYNC_UPGRADE_KEYS = Object.keys(CONFIG.UPGRADES || {});

function toNonNegativeNumber(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return num < 0 ? 0 : num;
}

function toSafeInteger(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  const floored = Math.floor(num);
  return floored < 0 ? 0 : floored;
}

function buildEggMap(inventory = []) {
  const eggs = {};
  SYNC_RARITY_KEYS.forEach((rarity) => {
    eggs[rarity] = 0;
  });
  inventory?.forEach((item) => {
    if (!item || !item.rarity) return;
    eggs[item.rarity] = toSafeInteger(item.quantity);
  });
  return eggs;
}

function buildUpgradeMap(upgrades = []) {
  const upgradeMap = {};
  SYNC_UPGRADE_KEYS.forEach((key) => {
    upgradeMap[key] = 0;
  });
  upgrades?.forEach((item) => {
    if (!item || !item.upgrade_key) return;
    upgradeMap[item.upgrade_key] = toSafeInteger(item.level);
  });
  return upgradeMap;
}

function buildServerSyncSnapshot(serverData) {
  if (!serverData) return null;
  return {
    coins: toNonNegativeNumber(serverData.profile?.coins),
    blackPityCounter: toNonNegativeNumber(serverData.profile?.black_pity_counter),
    eggs: buildEggMap(serverData.inventory),
    upgrades: buildUpgradeMap(serverData.upgrades),
    stats: {
      totalClicks: toNonNegativeNumber(serverData.stats?.total_clicks),
      totalEggsSold: toNonNegativeNumber(serverData.stats?.total_eggs_sold),
    },
  };
}

async function fetchServerSnapshot(token, { context = '[同步]' } = {}) {
  if (!token) return null;
  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/game/state`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const result = await response.json().catch((jsonError) => {
        console.warn(`${context} 云端状态解析失败`, jsonError);
        return null;
      });

      if (result?.success && result.data) {
        return buildServerSyncSnapshot(result.data);
      }

      if (result) {
        console.warn(`${context} 云端状态响应异常`, result);
      }
    } else {
      console.warn(`${context} 获取云端数据失败，状态码: ${response.status}`);
    }
  } catch (error) {
    console.warn(`${context} 获取云端数据失败`, error);
  }

  return null;
}

function localHasNewerProgress(localData, serverSnapshot) {
  if (!serverSnapshot) return true;
  const parse = (value) => toNonNegativeNumber(value);

  if (parse(localData.coins) > serverSnapshot.coins) return true;
  if (parse(localData.blackPityCounter) > serverSnapshot.blackPityCounter) return true;

  const eggKeys = new Set([
    ...Object.keys(serverSnapshot.eggs || {}),
    ...Object.keys(localData.eggs || {}),
  ]);
  for (const rarity of eggKeys) {
    const localQty = parse(localData.eggs?.[rarity]);
    const serverQty = toNonNegativeNumber(serverSnapshot.eggs?.[rarity]);
    if (localQty > serverQty) return true;
  }

  const upgradeKeys = new Set([
    ...Object.keys(serverSnapshot.upgrades || {}),
    ...Object.keys(localData.upgrades || {}),
  ]);
  for (const key of upgradeKeys) {
    const localLevel = parse(localData.upgrades?.[key]);
    const serverLevel = toNonNegativeNumber(serverSnapshot.upgrades?.[key]);
    if (localLevel > serverLevel) return true;
  }

  if (parse(localData.stats?.totalClicks) > serverSnapshot.stats.totalClicks) return true;
  if (parse(localData.stats?.totalEggsSold) > serverSnapshot.stats.totalEggsSold) return true;

  return false;
}

function applyServerSnapshotToLocal(snapshot, { reason } = {}) {
  if (!snapshot) return;

  const eggs = {};
  SYNC_RARITY_KEYS.forEach((rarity) => {
    const serverQty = snapshot.eggs?.[rarity] ?? 0;
    eggs[rarity] = toSafeInteger(serverQty);
  });

  const upgrades = {};
  SYNC_UPGRADE_KEYS.forEach((key) => {
    const serverLevel = snapshot.upgrades?.[key] ?? 0;
    const minLevel = key === 'level' ? 1 : 0;
    const maxLevel = CONFIG.UPGRADES?.[key]?.maxLevel;
    let clampedLevel = Math.max(toSafeInteger(serverLevel), minLevel);
    if (typeof maxLevel === 'number') {
      clampedLevel = Math.min(clampedLevel, maxLevel);
    }
    upgrades[key] = clampedLevel;
  });

  const nextState = {
    ...state,
    eggs,
    upgrades,
    coins: toNonNegativeNumber(snapshot.coins),
    blackPityCounter: toSafeInteger(snapshot.blackPityCounter),
    totalClicks: toSafeInteger(snapshot.stats?.totalClicks),
    totalEggsSold: toSafeInteger(snapshot.stats?.totalEggsSold),
  };

  Object.assign(state, nextState);
  saveGame();
  updateAllDisplays();

  if (reason) {
    console.log('[同步] 已根据云端数据刷新本地存档:', reason);
  } else {
    console.log('[同步] 已根据云端数据刷新本地存档');
  }
}

async function refreshCloudState({ reason, silent } = {}) {
  if (isRefreshingCloudState) return;
  isRefreshingCloudState = true;

  const token = getStoredAuthToken();
  if (!token) {
    isRefreshingCloudState = false;
    return;
  }

  try {
    const snapshot = await fetchServerSnapshot(token, { context: '[云端刷新]' });
    if (snapshot) {
      applyServerSnapshotToLocal(snapshot, { reason: reason || 'manual refresh' });
      if (!silent) {
        showToast('已加载最新云端存档', 'success');
      }
    }
  } finally {
    isRefreshingCloudState = false;
  }
}

function ensureCloudRefreshHandlers() {
  if (cloudRefreshHandlerRegistered) return;

  if (!cloudFocusHandler) {
    cloudFocusHandler = () => {
      refreshCloudState({ reason: 'window focus', silent: true });
    };
    window.addEventListener('focus', cloudFocusHandler);
  }

  if (!cloudVisibilityHandler) {
    cloudVisibilityHandler = () => {
      if (document.visibilityState === 'visible') {
        refreshCloudState({ reason: 'visibilitychange', silent: true });
      }
    };
    document.addEventListener('visibilitychange', cloudVisibilityHandler);
  }

  if (!cloudRefreshIntervalId) {
    cloudRefreshIntervalId = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      refreshCloudState({ reason: 'auto poll', silent: true });
    }, CLOUD_REFRESH_INTERVAL_MS);
  }

  cloudRefreshHandlerRegistered = true;
  refreshCloudState({ reason: 'start polling', silent: true });
}

function disableCloudRefreshHandlers() {
  if (cloudFocusHandler) {
    window.removeEventListener('focus', cloudFocusHandler);
    cloudFocusHandler = null;
  }

  if (cloudVisibilityHandler) {
    document.removeEventListener('visibilitychange', cloudVisibilityHandler);
    cloudVisibilityHandler = null;
  }

  if (cloudRefreshIntervalId) {
    clearInterval(cloudRefreshIntervalId);
    cloudRefreshIntervalId = null;
  }

  cloudRefreshHandlerRegistered = false;
}

async function syncLocalDataToServer(token) {
  try {
    // 从 localStorage 读取本地游戏数据
    const localSaveKey = CONFIG.STORAGE_KEY;
    const savedData = localStorage.getItem(localSaveKey);
    
    if (!savedData) {
      console.log('[同步] 未发现本地游戏数据，跳过同步');
      return;
    }
    
    const gameState = JSON.parse(savedData);
    
    // 检查是否有有效数据
    const hasValidData = (
      (gameState.coins && gameState.coins > 0) ||
      (gameState.eggs && Object.values(gameState.eggs).some(qty => qty > 0)) ||
      (gameState.upgrades && Object.values(gameState.upgrades).some(level => level > 0))
    );
    
    if (!hasValidData) {
      console.log('[同步] 本地数据为空，跳过同步');
      return;
    }
    
    console.log('[同步] 开始同步本地数据到服务器...', gameState);
    
    // 准备要同步的数据
    const localData = {
      eggs: gameState.eggs || {},
      coins: gameState.coins || 0,
      upgrades: gameState.upgrades || {},
      stats: {
        totalClicks: gameState.totalClicks || 0,
        totalEggsSold: gameState.totalEggsSold || 0,
      },
      blackPityCounter: gameState.blackPityCounter || 0,
    };
    
    const serverSnapshot = await fetchServerSnapshot(token);

    if (serverSnapshot && !localHasNewerProgress(localData, serverSnapshot)) {
      console.log('[同步] 云端数据领先，跳过本地上传');
      applyServerSnapshotToLocal(serverSnapshot, { reason: '云端进度领先' });
      showToast('检测到云端进度更高，已加载云端存档', 'success');
      return;
    }
    
    // 调用同步 API
    const response = await fetch(`${CONFIG.API_BASE_URL}/game/sync-local-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ localData })
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log('[同步] 本地数据同步成功！');
      const mergedSnapshot = buildServerSyncSnapshot(result.data);
      if (mergedSnapshot) {
        applyServerSnapshotToLocal(mergedSnapshot, { reason: '同步完成' });
      }
      showToast('本地游戏数据已同步', 'success');
    } else {
      console.warn('[同步] 同步失败:', result.error);
      // 不阻塞登录流程
    }
  } catch (error) {
    console.error('[同步] 同步本地数据失败:', error);
    // 不阻塞登录流程
  }
}

// ==================== 登录处理 ====================

async function handleLogin(email, password, rememberMe) {
  try {
    showToast('正在登录...', 'success');
    
    const response = await fetch(`${CONFIG.API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const result = await response.json();
    
    if (!response.ok || !result.success) {
      throw new Error(result.error?.message || '登录失败');
    }
    
    // 保存 token
    if (rememberMe) {
      localStorage.setItem('auth_token', result.data.token);
    } else {
      sessionStorage.setItem('auth_token', result.data.token);
    }
    
    // 保存用户信息
    localStorage.setItem('user_info', JSON.stringify(result.data.user));
    
    // 同步本地游戏数据到服务器
    await syncLocalDataToServer(result.data.token);
    ensureCloudRefreshHandlers();
    
    // 更新 UI
    updateUserUI(result.data.user);
    closeAuthModal();
    showToast('登录成功！', 'success');
    
  } catch (error) {
    console.error('登录失败:', error);
    showToast(error.message || '登录失败，请检查邮箱和密码', 'error');
  }
}

// ==================== 注册处理 ====================

async function handleRegister(email, password) {
  try {
    showToast('正在注册...', 'success');
    
    const response = await fetch(`${CONFIG.API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const result = await response.json();
    
    if (!response.ok || !result.success) {
      throw new Error(result.error?.message || '注册失败');
    }
    
    showToast('注册成功！正在自动登录...', 'success');
    
    // 注册成功后自动登录
    if (result.data.token && result.data.user) {
      localStorage.setItem('auth_token', result.data.token);
      localStorage.setItem('user_info', JSON.stringify(result.data.user));
      
      // 同步本地游戏数据到服务器
      await syncLocalDataToServer(result.data.token);
      ensureCloudRefreshHandlers();
      
      updateUserUI(result.data.user);
      closeAuthModal();
      showToast('注册成功，欢迎！', 'success');
    } else {
      // 如果后端不返回 token，切换到登录
      switchAuthTab('login');
      const loginEmail = document.getElementById('loginEmail');
      if (loginEmail) loginEmail.value = email;
      showToast('注册成功！请登录', 'success');
    }
    
  } catch (error) {
    console.error('注册失败:', error);
    showToast(error.message || '注册失败，请稍后重试', 'error');
  }
}

// ==================== 更新用户 UI ====================

function updateUserUI(user) {
  const loginBtn = document.getElementById('loginBtn');
  const userInfoWrapper = document.getElementById('userInfoWrapper');
  const userNickname = document.getElementById('userNickname');
  
  if (loginBtn) loginBtn.style.display = 'none';
  if (userInfoWrapper) userInfoWrapper.style.display = 'flex';
  if (userNickname) userNickname.textContent = user.nickname || user.email.split('@')[0];
}

// ==================== 退出登录 ====================

function handleLogout() {
  if (confirm('确定要退出登录吗？')) {
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
    localStorage.removeItem('user_info');
    disableCloudRefreshHandlers();
    
    const loginBtn = document.getElementById('loginBtn');
    const userInfoWrapper = document.getElementById('userInfoWrapper');
    
    if (loginBtn) loginBtn.style.display = 'flex';
    if (userInfoWrapper) userInfoWrapper.style.display = 'none';
    
    showToast('已退出登录', 'success');
  }
}

// ==================== 检查登录状态 ====================

export function checkAuthStatus() {
  const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  const userInfo = localStorage.getItem('user_info');
  
  // 检查 token 和 userInfo 是否有效（不为 null/undefined/"undefined"）
  if (token && userInfo && userInfo !== 'undefined' && userInfo !== 'null') {
    try {
      const user = JSON.parse(userInfo);
      updateUserUI(user);
      ensureCloudRefreshHandlers();
      refreshCloudState({ reason: 'auth status check', silent: true });
      return true;
    } catch (error) {
      console.error('解析用户信息失败:', error);
      // 清理无效数据
      localStorage.removeItem('user_info');
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_token');
      return false;
    }
  } else {
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) loginBtn.style.display = 'flex';
    return false;
  }
}

// ==================== Google OAuth 处理 ====================

// Google 登录按钮处理
function setupGoogleOAuth() {
  const googleLoginBtn = document.getElementById('googleLoginBtn');
  const googleRegisterBtn = document.getElementById('googleRegisterBtn');
  
  if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', () => {
      console.log('🔗 启动 Google OAuth 登录...');
      // 构建完整的 OAuth URL
      const oauthUrl = `${CONFIG.API_BASE_URL}${CONFIG.OAUTH.GOOGLE.AUTH_URL}`;
      console.log('OAuth URL:', oauthUrl);
      
      // 跳转到 Google OAuth 授权页面
      window.location.href = oauthUrl;
    });
  }
  
  if (googleRegisterBtn) {
    googleRegisterBtn.addEventListener('click', () => {
      console.log('🔗 启动 Google OAuth 注册...');
      // 注册和登录使用相同的 OAuth 流程
      const oauthUrl = `${CONFIG.API_BASE_URL}${CONFIG.OAUTH.GOOGLE.AUTH_URL}`;
      window.location.href = oauthUrl;
    });
  }
}

// OAuth 回调处理 (页面加载时检查 URL 参数)
function handleOAuthCallback() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const oauthSuccess = urlParams.get('oauth_success');
  const error = urlParams.get('error');
  
  if (oauthSuccess === 'true' && token) {
    // OAuth 登录成功
    console.log('✅ Google OAuth 登录成功');
    
    try {
      // 1. 保存 token 到 localStorage
      localStorage.setItem('auth_token', token);
      
      // 2. 解析 token 获取用户信息
      const payload = JSON.parse(atob(token.split('.')[1]));
      const user = {
        id: payload.userId,
        email: payload.email,
        nickname: payload.username
      };
      
      localStorage.setItem('user_info', JSON.stringify(user));
      
      // 3. 显示成功提示
      showToast('Google 登录成功！', 'success');
      
      // 4. 关闭登录模态框
      const authModal = document.getElementById('authModal');
      if (authModal) {
        authModal.classList.remove('active');
        document.body.style.overflow = '';
      }
      
      // 5. 清理 URL 参数
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // 6. 更新 UI
      updateUserUI(user);
      
      // 7. 同步本地数据
      syncLocalDataToServer(token);
      ensureCloudRefreshHandlers();
      
    } catch (error) {
      console.error('❌ Failed to parse OAuth token:', error);
      showToast('登录失败，请重试', 'error');
    }
    
  } else if (oauthSuccess === 'false' || error) {
    // OAuth 登录失败
    console.error('❌ Google OAuth 失败:', error);
    showToast(`Google 登录失败: ${error || '未知错误'}`, 'error');
    
    // 清理 URL 参数
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

// ==================== 初始化事件监听 ====================

export function initAuthUI() {
  console.log('🔐 初始化认证UI...');
  ensureCloudRefreshHandlers();
  
  // 先检查 OAuth 回调
  handleOAuthCallback();
  
  // 获取元素
  const authModal = document.getElementById('authModal');
  const authCloseBtn = document.getElementById('authCloseBtn');
  const loginBtn = document.getElementById('loginBtn');
  const userInfoBtn = document.getElementById('userInfoBtn');
  const userMenu = document.getElementById('userMenu');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  
  // 检查必要元素
  if (!authModal || !loginBtn) {
    console.error('❌ 认证UI元素未找到');
    return;
  }
  
  // 关闭模态框
  if (authCloseBtn) {
    authCloseBtn.addEventListener('click', closeAuthModal);
  }
  
  authModal.addEventListener('click', (e) => {
    if (e.target === authModal) closeAuthModal();
  });
  
  // 打开登录模态框
  loginBtn.addEventListener('click', () => {
    console.log('🔓 打开登录模态框');
    openAuthModal('login');
  });
  
  // 标签切换
  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      switchAuthTab(tab.dataset.tab);
    });
  });
  
  // 登录表单提交
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      if (!validateLoginForm()) return;
      
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;
      const rememberMe = document.getElementById('rememberMe')?.checked || false;
      
      await handleLogin(email, password, rememberMe);
    });
  }
  
  // 注册表单提交
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      if (!validateRegisterForm()) return;
      
      const email = document.getElementById('registerEmail').value.trim();
      const password = document.getElementById('registerPassword').value;
      
      await handleRegister(email, password);
    });
  }
  
  // 用户菜单切换
  if (userInfoBtn && userMenu) {
    userInfoBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userMenu.style.display = userMenu.style.display === 'block' ? 'none' : 'block';
    });
    
    // 点击其他地方关闭菜单
    document.addEventListener('click', () => {
      userMenu.style.display = 'none';
    });
  }
  
  // 退出登录
  const logoutLink = document.getElementById('logoutLink');
  if (logoutLink) {
    logoutLink.addEventListener('click', (e) => {
      e.preventDefault();
      handleLogout();
    });
  }
  
  // 设置密码显示/隐藏切换
  setupPasswordToggles();
  
  // 设置密码强度指示器
  setupPasswordStrengthIndicator();
  
  // 设置 Google OAuth 按钮
  setupGoogleOAuth();
  
  // 检查登录状态
  checkAuthStatus();
  
  console.log('✅ 认证UI初始化完成');
}

// DOMContentLoaded 时自动初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAuthUI);
} else {
  initAuthUI();
}
