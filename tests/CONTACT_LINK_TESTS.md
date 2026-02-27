# 联系我们 (Contact Us) Link - Unit Tests Documentation

## Overview
Comprehensive unit tests for the "联系我们" (Contact Us) link with email obfuscation functionality. All tests are located in `tests/contact-link.test.js`.

## Test Statistics
- **Total Tests**: 31
- **Test Suites**: 5
- **Pass Rate**: 100% ✓

## Test Suites

### 1. 联系我们 (Contact Us) - 邮件混淆处理 (14 tests)
Tests for basic email obfuscation and mailto link generation.

#### Tests:
- ✓ 应该能找到 contactLink 元素
  - Verifies the contact link element exists in DOM
  
- ✓ contactLink 应该有正确的初始属性
  - Validates href, text content, and CSS classes
  
- ✓ 应该能生成正确的混淆邮箱地址
  - Checks mailto link equals `mailto:weixinyongjiu@gmail.com`
  
- ✓ 混淆邮箱地址应该包含正确的用户名部分
  - Validates username portion: `weixinyongjiu`
  
- ✓ 混淆邮箱地址应该包含正确的域名部分
  - Validates domain portion: `gmail.com`
  
- ✓ 混淆邮箱地址应该是完整的 mailto 格式
  - Tests full regex pattern for valid mailto URI
  
- ✓ 混淆逻辑应该分离邮箱的三个部分
  - Verifies username, domain, and TLD are separated correctly
  
- ✓ contactLink 点击事件应该阻止默认行为
  - Tests preventDefault() is called on click
  
- ✓ contactLink 点击事件应该能访问混淆的邮箱地址
  - Validates click handler can construct correct mailto link
  
- ✓ 邮箱混淆的各个部分应该是字符串类型
  - Type checking for u, d, c variables
  
- ✓ 邮箱混淆的各个部分应该不为空
  - Validates all components have length > 0
  
- ✓ 混淆邮箱地址不应该包含空格
  - Checks for absence of whitespace
  
- ✓ 混淆邮箱地址不应该包含特殊字符（除了必要的符号）
  - Validates only allowed characters (@, .) in email
  
- ✓ 混淆逻辑应该能多次生成相同的邮箱地址
  - Tests idempotency of obfuscation logic

### 2. 联系我们 - DOM 集成测试 (5 tests)
Integration tests for DOM rendering and element selection.

#### Tests:
- ✓ contactLink 应该在 footer 中正确渲染
  - Verifies element renders with correct text
  
- ✓ contactLink 应该与其他 footer-link 共存
  - Tests multiple footer links coexist (3 total)
  
- ✓ contactLink 应该能通过 id 查询获取
  - Tests getElementById retrieval
  
- ✓ contactLink 应该有正确的 CSS 类名
  - Validates 'footer-link' class presence
  
- ✓ 从页脚链接列表中应该能识别 contactLink
  - Tests finding contact link among other footer links

### 3. 联系我们 - 邮件构建逻辑 (5 tests)
Tests for email format validation and standards compliance.

#### Tests:
- ✓ 邮件地址应该正确使用混淆的组件
  - Validates email construction from components
  
- ✓ 邮件地址格式应该符合 RFC 5322 基本要求
  - Tests basic RFC 5322 email format compliance
  
- ✓ 邮件主机部分应该是有效的域名
  - Validates domain structure
  
- ✓ 邮件本地部分应该只包含允许的字符
  - RFC 5322 character set validation
  
- ✓ 生成的 mailto 链接应该能被浏览器处理
  - Tests valid mailto URI scheme

### 4. 联系我们 - 安全性测试 (4 tests)
Security-focused tests for XSS prevention and injection protection.

#### Tests:
- ✓ 邮箱地址不应该包含 XSS 可能的字符
  - Checks for absence of `<>\"'` characters
  
- ✓ 邮箱地址不应该包含注入字符
  - Tests for absence of `;,&|` characters
  
- ✓ 混淆逻辑应该使用字面量而不是从外部源获取
  - Validates hardcoded email components
  
- ✓ 混淆的邮箱组件应该能通过简单的单元测试
  - Type and content validation of components

### 5. 联系我们 - 边界情况测试 (3 tests)
Edge case and robustness tests.

#### Tests:
- ✓ 即使 contactLink 元素不存在，混淆逻辑仍应工作
  - Tests obfuscation logic independence
  
- ✓ 混淆逻辑应该能在多个事件监听器中使用
  - Tests multiple click handlers work correctly
  
- ✓ 混淆邮箱地址应该能在任何时间生成
  - Tests 10 consecutive generations produce same result

## Implementation Details

### Source Code
- **Main Implementation**: `src/js/main.js` (lines 258-269)
- **Contact Link Element**: `index.html` (line 913)

### Email Obfuscation Pattern
```javascript
const u = 'weixinyongjiu';  // Username
const d = 'gmail';          // Domain
const c = 'com';            // TLD
window.location.href = `mailto:${u}@${d}.${c}`;
```

### Test Coverage Areas
1. **DOM Integration** - Element presence and structure
2. **Email Generation** - Correct mailto link construction
3. **Security** - XSS and injection prevention
4. **Standards Compliance** - RFC 5322 email format
5. **Robustness** - Edge cases and multiple invocations
6. **Type Safety** - Proper type checking

## Running Tests

### Run all contact link tests
```bash
npm test -- tests/contact-link.test.js
```

### Run all tests
```bash
npm test
```

### Watch mode
```bash
npm test -- --watch tests/contact-link.test.js
```

## Test Environment
- **Test Framework**: Vitest v1.6.1
- **Environment**: jsdom (browser-like DOM)
- **Language**: JavaScript (ES6+)
- **Duration**: ~789ms

## Internationalization
All test descriptions are in Chinese (Simplified) to align with the project's i18n requirement for Chinese and English language support.

## Future Enhancements
Potential areas for expansion:
- End-to-end tests with actual mailto behavior
- Performance benchmarks for email generation
- Accessibility testing for the contact link
- Multiple language test descriptions for i18n compliance
