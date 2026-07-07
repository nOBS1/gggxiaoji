import '../css/main.css';
import '../css/merge.css';
import { MergeManager } from './merge/mergeManager.js';

let mergeGame = null;

function init() {
  const container = document.getElementById('mergeGameContainer');

  if (!container) {
    console.error('[MergeGame] 找不到游戏容器');
    return;
  }

  mergeGame = new MergeManager(container);

  document.getElementById('resetBestBtn')?.addEventListener('click', () => {
    if (confirm('确定清除最高分吗？')) {
      mergeGame.resetBestScore();
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
