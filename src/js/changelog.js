/**
 * 更新日志弹窗交互模块
 */

// 获取DOM元素
const floatingChangelogBtn = document.getElementById('floatingChangelogBtn');
const changelogModal = document.getElementById('changelogModal');
const changelogModalClose = document.getElementById('changelogModalClose');

// 打开更新日志弹窗
function openChangelogModal() {
  changelogModal.classList.add('active');
  document.body.style.overflow = 'hidden'; // 防止背景滚动
  
  // 记录用户已查看更新日志
  localStorage.setItem('lastViewedChangelog', new Date().toISOString());
  localStorage.setItem('changelogVersion', '2.2.0');
}

// 关闭更新日志弹窗
function closeChangelogModal() {
  changelogModal.classList.remove('active');
  document.body.style.overflow = ''; // 恢复背景滚动
}

// 检查是否有新版本更新
function checkForNewVersion() {
  const lastViewedVersion = localStorage.getItem('changelogVersion');
  const currentVersion = '2.2.0';
  
  // 如果版本号不同，说明有新更新
  if (!lastViewedVersion || lastViewedVersion !== currentVersion) {
    // 添加一个小红点提示（可选）
    const btn = document.getElementById('floatingChangelogBtn');
    if (btn) {
      btn.classList.add('has-update');
      
      // 可以在CSS中添加 .has-update::after 伪元素来显示红点
    }
  }
}

// 事件监听器
if (floatingChangelogBtn) {
  floatingChangelogBtn.addEventListener('click', () => {
    openChangelogModal();
    // 移除更新提示
    floatingChangelogBtn.classList.remove('has-update');
  });
}

if (changelogModalClose) {
  changelogModalClose.addEventListener('click', closeChangelogModal);
}

// 点击弹窗背景关闭
if (changelogModal) {
  changelogModal.addEventListener('click', (e) => {
    if (e.target === changelogModal) {
      closeChangelogModal();
    }
  });
}

// 按ESC键关闭弹窗
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && changelogModal.classList.contains('active')) {
    closeChangelogModal();
  }
});

// 页面加载时检查是否有新版本
document.addEventListener('DOMContentLoaded', () => {
  checkForNewVersion();
});

// 导出函数供其他模块使用
export {
  openChangelogModal,
  closeChangelogModal,
  checkForNewVersion
};
