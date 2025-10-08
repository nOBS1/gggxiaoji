// 简单的 i18n 键验证脚本
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 检查 i18n.js 中的键重复问题...\n');

const i18nPath = path.join(__dirname, 'src', 'js', 'i18n.js');
const content = fs.readFileSync(i18nPath, 'utf-8');

// 检查是否有重复的键
const duplicatePattern = /(\w+):\s*['"{\[][\s\S]*?['"}\]],?\s*\n\s*\1:/g;
const matches = content.matchAll(duplicatePattern);

let hasDuplicates = false;
for (const match of matches) {
  console.log(`❌ 发现重复键: "${match[1]}"`);
  hasDuplicates = true;
}

if (!hasDuplicates) {
  console.log('✅ 没有发现重复的键！');
}

console.log('\n📝 检查特定键的存在性...');

const keysToCheck = [
  'upgradeTitle',
  'upgradeSubtitle',
  'upgradeName',
  'upgradeDesc'
];

keysToCheck.forEach(key => {
  const regex = new RegExp(`${key}:\\s*`, 'g');
  const count = (content.match(regex) || []).length;
  
  if (count === 0) {
    console.log(`❌ 键 "${key}" 不存在`);
  } else if (count === 1) {
    console.log(`✅ 键 "${key}" 存在 (1次)`);
  } else {
    console.log(`⚠️  键 "${key}" 出现 ${count} 次`);
  }
});

console.log('\n✨ 检查完成！');
