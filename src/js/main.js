import '../css/main.css';
import '../css/cards.css';
import { CardGame } from './cardGame.js';

function init() {
  const root = document.getElementById('cardGameRoot');
  if (!root) return;

  const game = new CardGame(root);

  document.getElementById('resetGameBtn')?.addEventListener('click', () => {
    if (confirm('确定重置卡牌存档吗？')) {
      game.reset();
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
