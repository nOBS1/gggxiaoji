/**
 * 认证系统 JavaScript
 * 处理登录、注册、用户状态管理
 */

// ==================== 工具函数 ====================

// 显示 Toast 提示
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  const toastIcon = document.getElementById('toastIcon');
  const toastMessage = document.getElementById('toastMessage');
  
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

const authModal = document.getElementById('authModal');
const authCloseBtn = document.getElementById('authCloseBtn');
const loginBtn = document.getElementById('loginBtn');
const userInfoBtn = document.getElementById('userInfoBtn');
const userMenu = document.getElementById('userMenu');

// 打开认证模态框
function openAuthModal(defaultTab = 'login') {
  authModal.classList.add('active');
  document.body.style.overflow = 'hidden';
  switchAuthTab(defaultTab);
}

// 关闭认证模态框
function closeAuthModal() {
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
  if (tab === 'login') {
    authTitle.textContent = '欢迎回来';
    authSubtitle.textContent = '登录以同步您的游戏进度';
  } else {
    authTitle.textContent = '创建账号';
    authSubtitle.textContent = '注册以保存您的游戏进度';
  }
}

// ==================== 密码显示/隐藏切换 ====================

function setupPasswordToggles() {
  const toggleBtns = document.querySelectorAll('.password-toggle');
  
  toggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const input = document.getElementById(targetId);
      
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
  const strengthFill = strengthDiv.querySelector('.strength-fill');
  const strengthText = strengthDiv.querySelector('.strength-text span');
  
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
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  
  let isValid = true;
  
  // 验证邮箱
  const emailError = document.getElementById('loginEmailError');
  const emailInput = document.getElementById('loginEmail');
  if (!email || !validateEmail(email)) {
    emailError.classList.add('show');
    emailInput.classList.add('error');
    isValid = false;
  } else {
    emailError.classList.remove('show');
    emailInput.classList.remove('error');
  }
  
  // 验证密码
  const passwordError = document.getElementById('loginPasswordError');
  const passwordInput = document.getElementById('loginPassword');
  if (!password || password.length < 6) {
    passwordError.textContent = '密码至少6个字符';
    passwordError.classList.add('show');
    passwordInput.classList.add('error');
    isValid = false;
  } else {
    passwordError.classList.remove('show');
    passwordInput.classList.remove('error');
  }
  
  return isValid;
}

function validateRegisterForm() {
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const agreeTerms = document.getElementById('agreeTerms').checked;
  
  let isValid = true;
  
  // 验证邮箱
  const emailError = document.getElementById('registerEmailError');
  const emailInput = document.getElementById('registerEmail');
  if (!email || !validateEmail(email)) {
    emailError.classList.add('show');
    emailInput.classList.add('error');
    isValid = false;
  } else {
    emailError.classList.remove('show');
    emailInput.classList.remove('error');
  }
  
  // 验证密码
  const passwordError = document.getElementById('registerPasswordError');
  const passwordInput = document.getElementById('registerPassword');
  if (!password || password.length < 8) {
    passwordError.textContent = '密码至少8个字符';
    passwordError.classList.add('show');
    passwordInput.classList.add('error');
    isValid = false;
  } else {
    passwordError.classList.remove('show');
    passwordInput.classList.remove('error');
  }
  
  // 验证确认密码
  const confirmError = document.getElementById('confirmPasswordError');
  const confirmInput = document.getElementById('confirmPassword');
  if (password !== confirmPassword) {
    confirmError.classList.add('show');
    confirmInput.classList.add('error');
    isValid = false;
  } else {
    confirmError.classList.remove('show');
    confirmInput.classList.remove('error');
  }
  
  // 验证用户协议
  if (!agreeTerms) {
    showToast('请阅读并同意用户协议', 'error');
    isValid = false;
  }
  
  return isValid;
}

// ==================== 登录处理 ====================

async function handleLogin(email, password, rememberMe) {
  const submitBtn = document.getElementById('loginSubmitBtn');
  submitBtn.classList.add('loading');
  submitBtn.disabled = true;
  
  try {
    // TODO: 替换为实际的 API 调用
    // const response = await fetch('/auth/login', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ email, password })
    // });
    
    // 模拟 API 调用
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // 模拟成功响应
    const mockUser = {
      id: '123',
      email: email,
      nickname: email.split('@')[0],
      token: 'mock_token_' + Date.now()
    };
    
    // 保存 token
    if (rememberMe) {
      localStorage.setItem('auth_token', mockUser.token);
    } else {
      sessionStorage.setItem('auth_token', mockUser.token);
    }
    
    // 保存用户信息
    localStorage.setItem('user_info', JSON.stringify({
      id: mockUser.id,
      email: mockUser.email,
      nickname: mockUser.nickname
    }));
    
    // 更新 UI
    updateUserUI(mockUser);
    closeAuthModal();
    showToast('登录成功！', 'success');
    
    // TODO: 加载云端存档
    // await loadCloudSave();
    
  } catch (error) {
    console.error('登录失败:', error);
    showToast('登录失败，请检查邮箱和密码', 'error');
  } finally {
    submitBtn.classList.remove('loading');
    submitBtn.disabled = false;
  }
}

// ==================== 注册处理 ====================

async function handleRegister(email, password) {
  const submitBtn = document.getElementById('registerSubmitBtn');
  submitBtn.classList.add('loading');
  submitBtn.disabled = true;
  
  try {
    // TODO: 替换为实际的 API 调用
    // const response = await fetch('/auth/register', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ email, password })
    // });
    
    // 模拟 API 调用
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // 模拟成功响应
    showToast('注册成功！请登录', 'success');
    
    // 切换到登录表单并填充邮箱
    switchAuthTab('login');
    document.getElementById('loginEmail').value = email;
    
  } catch (error) {
    console.error('注册失败:', error);
    showToast('注册失败，请稍后重试', 'error');
  } finally {
    submitBtn.classList.remove('loading');
    submitBtn.disabled = false;
  }
}

// ==================== 游客模式 ====================

function handleGuestMode() {
  closeAuthModal();
  showToast('以游客模式游玩，数据保存在本地', 'success');
  // 游客模式下隐藏登录按钮
  loginBtn.style.display = 'none';
}

// ==================== 更新用户 UI ====================

function updateUserUI(user) {
  loginBtn.style.display = 'none';
  userInfoBtn.style.display = 'flex';
  
  const userAvatar = document.getElementById('userAvatar');
  const userName = document.getElementById('userName');
  
  userAvatar.textContent = user.nickname.charAt(0).toUpperCase();
  userName.textContent = user.nickname;
}

// ==================== 退出登录 ====================

function handleLogout() {
  if (confirm('确定要退出登录吗？云端数据会保留，下次登录可继续游玩。')) {
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
    localStorage.removeItem('user_info');
    
    loginBtn.style.display = 'flex';
    userInfoBtn.style.display = 'none';
    
    showToast('已退出登录', 'success');
    
    // TODO: 切换回本地模式
    // switchToLocalMode();
  }
}

// ==================== 检查登录状态 ====================

function checkAuthStatus() {
  const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  const userInfo = localStorage.getItem('user_info');
  
  if (token && userInfo) {
    try {
      const user = JSON.parse(userInfo);
      updateUserUI(user);
      return true;
    } catch (error) {
      console.error('解析用户信息失败:', error);
      return false;
    }
  } else {
    loginBtn.style.display = 'flex';
    return false;
  }
}

// ==================== 初始化事件监听 ====================

export function initAuthUI() {
  // 关闭模态框
  authCloseBtn.addEventListener('click', closeAuthModal);
  authModal.addEventListener('click', (e) => {
    if (e.target === authModal) closeAuthModal();
  });
  
  // 打开登录模态框
  loginBtn.addEventListener('click', () => openAuthModal('login'));
  
  // 标签切换
  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      switchAuthTab(tab.dataset.tab);
    });
  });
  
  // 底部切换链接
  document.getElementById('switchToLogin').addEventListener('click', (e) => {
    e.preventDefault();
    switchAuthTab('login');
  });
  
  document.getElementById('switchToRegister').addEventListener('click', (e) => {
    e.preventDefault();
    switchAuthTab('register');
  });
  
  // 登录表单提交
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!validateLoginForm()) return;
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    await handleLogin(email, password, rememberMe);
  });
  
  // 注册表单提交
  document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!validateRegisterForm()) return;
    
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    
    await handleRegister(email, password);
  });
  
  // 游客模式按钮
  document.getElementById('guestModeBtn').addEventListener('click', handleGuestMode);
  document.getElementById('guestModeBtn2').addEventListener('click', handleGuestMode);
  
  // 用户菜单切换
  userInfoBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    userMenu.classList.toggle('show');
  });
  
  // 点击其他地方关闭菜单
  document.addEventListener('click', () => {
    userMenu.classList.remove('show');
  });
  
  // 用户菜单项
  document.getElementById('profileBtn').addEventListener('click', () => {
    showToast('个人资料功能即将上线', 'success');
  });
  
  document.getElementById('syncBtn').addEventListener('click', () => {
    showToast('正在同步数据...', 'success');
    // TODO: 实现数据同步
  });
  
  document.getElementById('settingsBtn').addEventListener('click', () => {
    showToast('设置功能即将上线', 'success');
  });
  
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);
  
  // OAuth 按钮（可选）
  document.getElementById('googleLoginBtn').addEventListener('click', () => {
    showToast('Google 登录功能即将上线', 'success');
  });
  
  document.getElementById('githubLoginBtn').addEventListener('click', () => {
    showToast('GitHub 登录功能即将上线', 'success');
  });
  
  // 设置密码显示/隐藏切换
  setupPasswordToggles();
  
  // 设置密码强度指示器
  setupPasswordStrengthIndicator();
  
  // 检查登录状态
  checkAuthStatus();
}

// ==================== 导出函数 ====================

export {
  openAuthModal,
  closeAuthModal,
  checkAuthStatus,
  showToast
};
