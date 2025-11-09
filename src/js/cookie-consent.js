/**
 * Cookie同意管理系统
 * 符合GDPR、CCPA等隐私法规要求
 */

const COOKIE_CONSENT_KEY = 'cookie_consent_preferences';
const CONSENT_VERSION = '1.0';

// Cookie类别定义
const COOKIE_CATEGORIES = {
  necessary: {
    id: 'necessary',
    name: {
      zh: '必要Cookie',
      en: 'Necessary Cookies'
    },
    description: {
      zh: '这些Cookie对于网站的基本功能是必需的，包括登录状态、语言偏好和游戏数据存储。无法禁用。',
      en: 'These cookies are essential for basic website functions, including login status, language preferences, and game data storage. Cannot be disabled.'
    },
    required: true,
    default: true
  },
  analytics: {
    id: 'analytics',
    name: {
      zh: '分析Cookie',
      en: 'Analytics Cookies'
    },
    description: {
      zh: '帮助我们了解访客如何使用网站，以便改进用户体验。使用Google Analytics收集匿名统计数据。',
      en: 'Help us understand how visitors use the website to improve user experience. Uses Google Analytics to collect anonymized statistics.'
    },
    required: false,
    default: false
  },
  advertising: {
    id: 'advertising',
    name: {
      zh: '广告Cookie',
      en: 'Advertising Cookies'
    },
    description: {
      zh: '用于展示相关广告并支持游戏运营。由Google AdSense提供。',
      en: 'Used to display relevant ads and support game operations. Provided by Google AdSense.'
    },
    required: false,
    default: false
  }
};

class CookieConsentManager {
  constructor() {
    this.preferences = this.loadPreferences();
    this.language = 'zh'; // 默认中文
  }

  /**
   * 初始化Cookie同意系统
   */
  init(language = 'zh') {
    this.language = language;
    
    // 如果用户还未做出选择，显示横幅
    if (!this.hasConsent()) {
      this.showBanner();
    } else {
      // 应用已保存的偏好设置
      this.applyPreferences();
    }

    // 绑定事件
    this.bindEvents();
  }

  /**
   * 加载已保存的偏好设置
   */
  loadPreferences() {
    try {
      const saved = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (saved) {
        const prefs = JSON.parse(saved);
        // 检查版本是否匹配
        if (prefs.version === CONSENT_VERSION) {
          return prefs;
        }
      }
    } catch (e) {
      console.error('Failed to load cookie preferences:', e);
    }
    return null;
  }

  /**
   * 保存偏好设置
   */
  savePreferences(preferences) {
    const prefs = {
      version: CONSENT_VERSION,
      timestamp: Date.now(),
      ...preferences
    };
    
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(prefs));
      this.preferences = prefs;
    } catch (e) {
      console.error('Failed to save cookie preferences:', e);
    }
  }

  /**
   * 检查是否已有同意记录
   */
  hasConsent() {
    return this.preferences !== null;
  }

  /**
   * 检查特定类别是否被允许
   */
  isAllowed(category) {
    if (!this.preferences) return false;
    if (COOKIE_CATEGORIES[category]?.required) return true;
    return this.preferences[category] === true;
  }

  /**
   * 显示Cookie同意横幅
   */
  showBanner() {
    const banner = document.getElementById('cookieConsentBanner');
    if (banner) {
      banner.classList.add('show');
    }
  }

  /**
   * 隐藏Cookie同意横幅
   */
  hideBanner() {
    const banner = document.getElementById('cookieConsentBanner');
    if (banner) {
      banner.classList.remove('show');
    }
  }

  /**
   * 显示Cookie设置模态框
   */
  showSettings() {
    const modal = document.getElementById('cookieSettingsModal');
    if (modal) {
      // 更新开关状态
      this.updateSettingsUI();
      modal.classList.add('show');
    }
  }

  /**
   * 隐藏Cookie设置模态框
   */
  hideSettings() {
    const modal = document.getElementById('cookieSettingsModal');
    if (modal) {
      modal.classList.remove('show');
    }
  }

  /**
   * 更新设置UI的开关状态
   */
  updateSettingsUI() {
    Object.keys(COOKIE_CATEGORIES).forEach(category => {
      const toggle = document.getElementById(`cookie-${category}`);
      if (toggle) {
        const isAllowed = this.preferences ? this.preferences[category] : COOKIE_CATEGORIES[category].default;
        toggle.checked = isAllowed || COOKIE_CATEGORIES[category].required;
      }
    });
  }

  /**
   * 接受所有Cookie
   */
  acceptAll() {
    const preferences = {};
    Object.keys(COOKIE_CATEGORIES).forEach(category => {
      preferences[category] = true;
    });
    
    this.savePreferences(preferences);
    this.applyPreferences();
    this.hideBanner();
    
    console.log('✅ All cookies accepted');
  }

  /**
   * 拒绝所有非必要Cookie
   */
  rejectAll() {
    const preferences = {};
    Object.keys(COOKIE_CATEGORIES).forEach(category => {
      preferences[category] = COOKIE_CATEGORIES[category].required;
    });
    
    this.savePreferences(preferences);
    this.applyPreferences();
    this.hideBanner();
    
    console.log('❌ Non-essential cookies rejected');
  }

  /**
   * 保存自定义设置
   */
  saveCustomSettings() {
    const preferences = {};
    
    Object.keys(COOKIE_CATEGORIES).forEach(category => {
      const toggle = document.getElementById(`cookie-${category}`);
      if (toggle) {
        preferences[category] = toggle.checked;
      } else {
        preferences[category] = COOKIE_CATEGORIES[category].required;
      }
    });
    
    this.savePreferences(preferences);
    this.applyPreferences();
    this.hideSettings();
    this.hideBanner();
    
    console.log('💾 Custom cookie settings saved:', preferences);
  }

  /**
   * 应用偏好设置
   */
  applyPreferences() {
    if (!this.preferences) return;

    // 应用分析Cookie设置
    if (this.isAllowed('analytics')) {
      this.enableAnalytics();
    } else {
      this.disableAnalytics();
    }

    // 应用广告Cookie设置
    if (this.isAllowed('advertising')) {
      this.enableAdvertising();
    } else {
      this.disableAdvertising();
    }

    console.log('🔧 Cookie preferences applied:', this.preferences);
  }

  /**
   * 启用Google Analytics
   */
  enableAnalytics() {
    if (window.gtag) {
      window.gtag('consent', 'update', {
        'analytics_storage': 'granted'
      });
      console.log('📊 Analytics enabled');
    }
  }

  /**
   * 禁用Google Analytics
   */
  disableAnalytics() {
    if (window.gtag) {
      window.gtag('consent', 'update', {
        'analytics_storage': 'denied'
      });
      console.log('📊 Analytics disabled');
    }
  }

  /**
   * 启用广告
   */
  enableAdvertising() {
    if (window.gtag) {
      window.gtag('consent', 'update', {
        'ad_storage': 'granted',
        'ad_user_data': 'granted',
        'ad_personalization': 'granted'
      });
      console.log('📢 Advertising enabled');
    }
  }

  /**
   * 禁用广告
   */
  disableAdvertising() {
    if (window.gtag) {
      window.gtag('consent', 'update', {
        'ad_storage': 'denied',
        'ad_user_data': 'denied',
        'ad_personalization': 'denied'
      });
      console.log('📢 Advertising disabled');
    }
  }

  /**
   * 绑定事件监听器
   */
  bindEvents() {
    // 接受所有按钮
    const acceptAllBtn = document.getElementById('acceptAllCookies');
    if (acceptAllBtn) {
      acceptAllBtn.addEventListener('click', () => this.acceptAll());
    }

    // 拒绝所有按钮
    const rejectAllBtn = document.getElementById('rejectAllCookies');
    if (rejectAllBtn) {
      rejectAllBtn.addEventListener('click', () => this.rejectAll());
    }

    // 自定义设置按钮
    const customizeBtn = document.getElementById('customizeCookies');
    if (customizeBtn) {
      customizeBtn.addEventListener('click', () => {
        this.hideBanner();
        this.showSettings();
      });
    }

    // 保存设置按钮
    const saveSettingsBtn = document.getElementById('saveCookieSettings');
    if (saveSettingsBtn) {
      saveSettingsBtn.addEventListener('click', () => this.saveCustomSettings());
    }

    // 取消设置按钮
    const cancelSettingsBtn = document.getElementById('cancelCookieSettings');
    if (cancelSettingsBtn) {
      cancelSettingsBtn.addEventListener('click', () => {
        this.hideSettings();
        if (!this.hasConsent()) {
          this.showBanner();
        }
      });
    }

    // 隐私设置按钮（右下角浮动按钮）
    const privacyBtn = document.getElementById('privacySettingsBtn');
    if (privacyBtn) {
      privacyBtn.addEventListener('click', () => this.showSettings());
    }

    // 点击模态框背景关闭
    const modal = document.getElementById('cookieSettingsModal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.hideSettings();
          if (!this.hasConsent()) {
            this.showBanner();
          }
        }
      });
    }
  }

  /**
   * 更新语言
   */
  setLanguage(language) {
    this.language = language;
    this.updateTexts();
  }

  /**
   * 更新界面文本
   */
  updateTexts() {
    // 这里可以添加动态更新文本的逻辑
    // 目前使用data-i18n属性由i18n系统处理
  }
}

// 导出单例
export const cookieConsent = new CookieConsentManager();

// 自动初始化（在DOM加载完成后）
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // 延迟1秒显示，避免干扰页面加载
      setTimeout(() => {
        cookieConsent.init();
      }, 1000);
    });
  } else {
    setTimeout(() => {
      cookieConsent.init();
    }, 1000);
  }
}
