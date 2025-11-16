/**
 * 游客自动登录系统
 * 用户访问时自动创建匿名账号，无需注册即可游玩
 */

// 生成唯一的游客ID
function generateGuestId() {
  return 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// 获取或创建游客ID
export function getOrCreateGuestId() {
  let guestId = localStorage.getItem('guest_id');
  
  if (!guestId) {
    guestId = generateGuestId();
    localStorage.setItem('guest_id', guestId);
    console.log('🎮 创建新游客账号:', guestId);
  } else {
    console.log('👋 欢迎回来，游客:', guestId);
  }
  
  return guestId;
}

// 获取游客昵称（用于显示）
export function getGuestNickname() {
  const guestId = getOrCreateGuestId();
  // 提取ID的后8位作为昵称
  const shortId = guestId.split('_').pop().substring(0, 8);
  return `游客${shortId}`;
}

// 检查是否为游客账号
export function isGuestUser() {
  const guestId = localStorage.getItem('guest_id');
  return guestId && guestId.startsWith('guest_');
}

// 初始化游客系统
export function initGuestAuth() {
  const guestId = getOrCreateGuestId();
  const nickname = getGuestNickname();
  
  // 更新UI显示游客信息
  updateGuestUI(nickname);
  
  return {
    guestId,
    nickname,
    isGuest: true
  };
}

// 更新UI显示游客信息
function updateGuestUI(nickname) {
  // 隐藏登录按钮
  const loginBtn = document.getElementById('loginBtn');
  if (loginBtn) {
    loginBtn.style.display = 'none';
  }
  
  // 显示游客信息
  const userInfoWrapper = document.getElementById('userInfoWrapper');
  if (userInfoWrapper) {
    userInfoWrapper.style.display = 'block';
  }
  
  // 设置游客昵称
  const userNickname = document.getElementById('userNickname');
  if (userNickname) {
    userNickname.textContent = nickname;
  }
  
  // 设置游客头像（使用默认头像）
  const userAvatar = document.getElementById('userAvatar');
  if (userAvatar) {
    userAvatar.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="%23deb887"/><text x="50" y="60" text-anchor="middle" font-size="40">🐥</text></svg>';
  }
}

// 清除游客数据（用于测试或重置）
export function clearGuestData() {
  localStorage.removeItem('guest_id');
  console.log('🗑️ 游客数据已清除');
}
