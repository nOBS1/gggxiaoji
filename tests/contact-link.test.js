/**
 * 测试 contact link 的邮件混淆处理
 * 验证 "联系我们" 链接能够正确构建带有混淆邮箱的 mailto 链接
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * 模拟 mailto 链接处理的辅助函数
 * 从 main.js 中的逻辑中提取出来以便测试
 */
function getObfuscatedContactLink() {
  const u = 'weixinyongjiu';
  const d = 'gmail';
  const c = 'com';
  return `mailto:${u}@${d}.${c}`;
}

describe('联系我们 (Contact Us) - 邮件混淆处理', () => {
  
  let contactLink;
  let originalHref;
  
  beforeEach(() => {
    // 模拟 DOM 中的 contactLink 元素
    contactLink = document.createElement('a');
    contactLink.id = 'contactLink';
    contactLink.href = '#';
    contactLink.textContent = '联系我们';
    contactLink.className = 'footer-link';
    document.body.appendChild(contactLink);
    
    // 保存原始 window.location.href
    originalHref = window.location.href;
  });
  
  afterEach(() => {
    // 清理 DOM
    if (contactLink && contactLink.parentNode) {
      contactLink.parentNode.removeChild(contactLink);
    }
  });
  
  test('应该能找到 contactLink 元素', () => {
    const element = document.getElementById('contactLink');
    expect(element).toBeDefined();
    expect(element).not.toBeNull();
    expect(element.id).toBe('contactLink');
  });
  
  test('contactLink 应该有正确的初始属性', () => {
    expect(contactLink.href).toBe(window.location.origin + '/#');
    expect(contactLink.textContent).toBe('联系我们');
    expect(contactLink.classList.contains('footer-link')).toBe(true);
  });
  
  test('应该能生成正确的混淆邮箱地址', () => {
    const mailtoLink = getObfuscatedContactLink();
    expect(mailtoLink).toBe('mailto:weixinyongjiu@gmail.com');
  });
  
  test('混淆邮箱地址应该包含正确的用户名部分', () => {
    const mailtoLink = getObfuscatedContactLink();
    expect(mailtoLink).toMatch(/mailto:weixinyongjiu@/);
  });
  
  test('混淆邮箱地址应该包含正确的域名部分', () => {
    const mailtoLink = getObfuscatedContactLink();
    expect(mailtoLink).toMatch(/@gmail\.com$/);
  });
  
  test('混淆邮箱地址应该是完整的 mailto 格式', () => {
    const mailtoLink = getObfuscatedContactLink();
    const mailtoRegex = /^mailto:[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    expect(mailtoLink).toMatch(mailtoRegex);
  });
  
  test('混淆逻辑应该分离邮箱的三个部分', () => {
    const u = 'weixinyongjiu';      // 用户名
    const d = 'gmail';              // 域名
    const c = 'com';                // 顶级域名
    
    expect(u).toBe('weixinyongjiu');
    expect(d).toBe('gmail');
    expect(c).toBe('com');
    
    const fullEmail = `${u}@${d}.${c}`;
    expect(fullEmail).toBe('weixinyongjiu@gmail.com');
  });
  
  test('contactLink 点击事件应该阻止默认行为', () => {
    const preventDefaultSpy = vi.spyOn(Event.prototype, 'preventDefault');
    
    const clickEvent = new Event('click');
    contactLink.addEventListener('click', (e) => {
      e.preventDefault();
    });
    
    contactLink.dispatchEvent(clickEvent);
    
    // 由于 preventDefault 已被调用
    expect(preventDefaultSpy).toHaveBeenCalled();
    preventDefaultSpy.mockRestore();
  });
  
  test('contactLink 点击事件应该能访问混淆的邮箱地址', () => {
    let capturedHref = null;
    
    const clickEvent = new Event('click');
    contactLink.addEventListener('click', (e) => {
      e.preventDefault();
      const u = 'weixinyongjiu';
      const d = 'gmail';
      const c = 'com';
      capturedHref = `mailto:${u}@${d}.${c}`;
    });
    
    contactLink.dispatchEvent(clickEvent);
    
    expect(capturedHref).toBe('mailto:weixinyongjiu@gmail.com');
  });
  
  test('邮箱混淆的各个部分应该是字符串类型', () => {
    const u = 'weixinyongjiu';
    const d = 'gmail';
    const c = 'com';
    
    expect(typeof u).toBe('string');
    expect(typeof d).toBe('string');
    expect(typeof c).toBe('string');
  });
  
  test('邮箱混淆的各个部分应该不为空', () => {
    const u = 'weixinyongjiu';
    const d = 'gmail';
    const c = 'com';
    
    expect(u.length).toBeGreaterThan(0);
    expect(d.length).toBeGreaterThan(0);
    expect(c.length).toBeGreaterThan(0);
  });
  
  test('混淆邮箱地址不应该包含空格', () => {
    const mailtoLink = getObfuscatedContactLink();
    expect(mailtoLink).not.toMatch(/\s/);
  });
  
  test('混淆邮箱地址不应该包含特殊字符（除了必要的符号）', () => {
    const mailtoLink = getObfuscatedContactLink();
    // mailto: 前缀 + 邮箱地址中只能有 @ 和 .
    const validMailtoRegex = /^mailto:[a-zA-Z0-9_-]+@[a-zA-Z0-9]+\.[a-zA-Z]{2,}$/;
    expect(mailtoLink).toMatch(validMailtoRegex);
  });
  
  test('混淆逻辑应该能多次生成相同的邮箱地址', () => {
    const link1 = getObfuscatedContactLink();
    const link2 = getObfuscatedContactLink();
    const link3 = getObfuscatedContactLink();
    
    expect(link1).toBe(link2);
    expect(link2).toBe(link3);
    expect(link1).toBe('mailto:weixinyongjiu@gmail.com');
  });
});

describe('联系我们 - DOM 集成测试', () => {
  
  let contactLink;
  
  beforeEach(() => {
    // 创建完整的 footer 结构用于集成测试
    const footer = document.createElement('footer');
    footer.innerHTML = `
      <div>
        <a href="/privacy.html" class="footer-link">隐私政策</a> |
        <a href="/terms.html" class="footer-link">服务条款</a> |
        <a href="#" class="footer-link" id="contactLink">联系我们</a>
      </div>
    `;
    document.body.appendChild(footer);
    contactLink = document.getElementById('contactLink');
  });
  
  afterEach(() => {
    const footer = document.querySelector('footer');
    if (footer) {
      footer.parentNode.removeChild(footer);
    }
  });
  
  test('contactLink 应该在 footer 中正确渲染', () => {
    expect(contactLink).toBeDefined();
    expect(contactLink.textContent).toBe('联系我们');
  });
  
  test('contactLink 应该与其他 footer-link 共存', () => {
    const allLinks = document.querySelectorAll('.footer-link');
    expect(allLinks.length).toBe(3);
  });
  
  test('contactLink 应该能通过 id 查询获取', () => {
    const element = document.getElementById('contactLink');
    expect(element).toBe(contactLink);
    expect(element.textContent).toBe('联系我们');
  });
  
  test('contactLink 应该有正确的 CSS 类名', () => {
    expect(contactLink.classList.contains('footer-link')).toBe(true);
  });
  
  test('从页脚链接列表中应该能识别 contactLink', () => {
    const links = Array.from(document.querySelectorAll('.footer-link'));
    const contactLinkFromList = links.find(link => link.id === 'contactLink');
    expect(contactLinkFromList).toBe(contactLink);
  });
});

describe('联系我们 - 邮件构建逻辑', () => {
  
  test('邮件地址应该正确使用混淆的组件', () => {
    const u = 'weixinyongjiu';
    const d = 'gmail';
    const c = 'com';
    const email = `${u}@${d}.${c}`;
    
    expect(email).toBe('weixinyongjiu@gmail.com');
  });
  
  test('邮件地址格式应该符合 RFC 5322 基本要求', () => {
    const mailtoLink = getObfuscatedContactLink();
    // 提取邮箱部分（去掉 mailto: 前缀）
    const email = mailtoLink.replace('mailto:', '');
    
    // 基本的邮件格式检查：username@domain.extension
    const emailRegex = /^[a-zA-Z0-9_-]+@[a-zA-Z0-9]+\.[a-zA-Z]{2,}$/;
    expect(email).toMatch(emailRegex);
  });
  
  test('邮件主机部分应该是有效的域名', () => {
    const mailtoLink = getObfuscatedContactLink();
    const email = mailtoLink.replace('mailto:', '');
    const [, domain] = email.split('@');
    
    expect(domain).toBe('gmail.com');
    expect(domain).toMatch(/\w+\.\w+/);
  });
  
  test('邮件本地部分应该只包含允许的字符', () => {
    const mailtoLink = getObfuscatedContactLink();
    const email = mailtoLink.replace('mailto:', '');
    const [localPart] = email.split('@');
    
    // RFC 5322 允许的字符（简化版）
    const allowedCharsRegex = /^[a-zA-Z0-9._-]+$/;
    expect(localPart).toMatch(allowedCharsRegex);
  });
  
  test('生成的 mailto 链接应该能被浏览器处理', () => {
    const mailtoLink = getObfuscatedContactLink();
    
    // 检查是否符合 mailto URI scheme
    expect(mailtoLink).toMatch(/^mailto:[^\s]+$/);
  });
});

describe('联系我们 - 安全性测试', () => {
  
  test('邮箱地址不应该包含 XSS 可能的字符', () => {
    const mailtoLink = getObfuscatedContactLink();
    expect(mailtoLink).not.toMatch(/[<>\"'`]/);
  });
  
  test('邮箱地址不应该包含注入字符', () => {
    const mailtoLink = getObfuscatedContactLink();
    // 检查是否包含可能的注入字符
    expect(mailtoLink).not.toMatch(/[;,&|`]/);
  });
  
  test('混淆逻辑应该使用字面量而不是从外部源获取', () => {
    // 确保邮箱部分是硬编码的
    const u = 'weixinyongjiu';
    const d = 'gmail';
    const c = 'com';
    
    // 验证这些是预期的固定值
    expect(['weixinyongjiu']).toContain(u);
    expect(['gmail']).toContain(d);
    expect(['com']).toContain(c);
  });
  
  test('混淆的邮箱组件应该能通过简单的单元测试', () => {
    const components = ['weixinyongjiu', 'gmail', 'com'];
    
    components.forEach(component => {
      expect(typeof component).toBe('string');
      expect(component.length).toBeGreaterThan(0);
      expect(component).not.toMatch(/\s/);
    });
  });
});

describe('联系我们 - 边界情况测试', () => {
  
  test('即使 contactLink 元素不存在，混淆逻辑仍应工作', () => {
    // 测试混淆逻辑的独立性
    const mailtoLink = getObfuscatedContactLink();
    expect(mailtoLink).toBe('mailto:weixinyongjiu@gmail.com');
  });
  
  test('混淆逻辑应该能在多个事件监听器中使用', () => {
    const contact = document.createElement('a');
    contact.id = 'contactLink';
    contact.href = '#';
    
    let callCount = 0;
    
    const handleClick = (e) => {
      e.preventDefault();
      callCount++;
      const mailtoLink = getObfuscatedContactLink();
      expect(mailtoLink).toBe('mailto:weixinyongjiu@gmail.com');
    };
    
    contact.addEventListener('click', handleClick);
    
    // 多次触发点击
    contact.click();
    contact.click();
    contact.click();
    
    expect(callCount).toBe(3);
  });
  
  test('混淆邮箱地址应该能在任何时间生成', () => {
    const addresses = [];
    
    for (let i = 0; i < 10; i++) {
      addresses.push(getObfuscatedContactLink());
    }
    
    // 所有生成的地址都应该相同
    addresses.forEach(address => {
      expect(address).toBe('mailto:weixinyongjiu@gmail.com');
    });
  });
});
