import '../css/main.css';
import '../css/cards.css';
import '../css/battle.css';
import { BattleGame } from './battle/battleGame.js';
import { CardGame } from './cardGame.js';

function init() {
  const cardRoot = document.getElementById('cardGameRoot');
  const battleRoot = document.getElementById('battleGameRoot');
  if (!cardRoot || !battleRoot) return;

  const cardGame = new CardGame(cardRoot);
  new BattleGame(battleRoot);
  bindViewTabs();
  bindRulesDialog();
  window.addEventListener('beforeunload', () => cardGame.destroy(), { once: true });

  document.getElementById('resetGameBtn')?.addEventListener('click', () => {
    if (confirm('确定重置卡牌存档吗？')) {
      cardGame.reset();
    }
  });
}

function bindRulesDialog() {
  const overlay = document.getElementById('rulesOverlay');
  const dialog = document.getElementById('rulesDialog');
  const openButton = document.getElementById('rulesBtn');
  const closeButton = document.getElementById('rulesCloseBtn');
  if (!overlay || !dialog || !openButton || !closeButton) return;

  let closeTimer;
  let previousFocus;
  const closeMs = Number.parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue('--modal-close-dur')
  ) || 150;

  const openModal = () => {
    window.clearTimeout(closeTimer);
    previousFocus = document.activeElement;
    overlay.hidden = false;
    document.body.classList.add('has-open-dialog');
    dialog.classList.remove('is-closing');
    requestAnimationFrame(() => {
      overlay.classList.add('is-open');
      dialog.classList.add('is-open');
      closeButton.focus();
    });
  };

  const closeModal = () => {
    dialog.classList.remove('is-open');
    dialog.classList.add('is-closing');
    overlay.classList.remove('is-open');
    closeTimer = window.setTimeout(() => {
      dialog.classList.remove('is-closing');
      overlay.hidden = true;
      document.body.classList.remove('has-open-dialog');
      previousFocus?.focus();
    }, closeMs);
  };

  openButton.addEventListener('click', openModal);
  closeButton.addEventListener('click', closeModal);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) closeModal();
  });
  document.addEventListener('keydown', (event) => {
    if (overlay.hidden) return;
    if (event.key === 'Escape') {
      closeModal();
      return;
    }
    if (event.key !== 'Tab') return;

    const focusable = [...dialog.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])')]
      .filter((element) => !element.disabled);
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  });
}

function bindViewTabs() {
  const bar = document.querySelector('.t-tabs');
  if (!bar) return;

  const pill = bar.querySelector('.t-tabs-pill');
  const tabs = [...bar.querySelectorAll('.t-tab')];
  const views = [...document.querySelectorAll('.game-view')];
  const resetButton = document.getElementById('resetGameBtn');
  const closeTimers = new Map();

  const moveTo = (tab, shouldAnimate) => {
    if (!shouldAnimate) {
      const previous = pill.style.transition;
      pill.style.transition = 'none';
      pill.style.transform = `translateX(${tab.offsetLeft}px)`;
      pill.style.width = `${tab.offsetWidth}px`;
      void pill.offsetWidth;
      pill.style.transition = previous;
      return;
    }
    pill.style.transform = `translateX(${tab.offsetLeft}px)`;
    pill.style.width = `${tab.offsetWidth}px`;
  };

  const activate = (tab, shouldAnimate = true) => {
    tabs.forEach((item) => item.setAttribute('aria-selected', item === tab ? 'true' : 'false'));
    views.forEach((view) => {
      const isActive = view.id === tab.getAttribute('aria-controls');
      if (isActive) {
        window.clearTimeout(closeTimers.get(view));
        closeTimers.delete(view);
        view.classList.remove('is-closing');
        view.hidden = false;
        view.setAttribute('data-open', 'false');
        requestAnimationFrame(() => view.setAttribute('data-open', 'true'));
      } else if (!view.hidden) {
        view.classList.add('is-closing');
        view.setAttribute('data-open', 'false');
        const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 0
          : readCssDuration(view, '--panel-close-dur');
        const timer = window.setTimeout(() => {
          if (view.getAttribute('data-open') === 'false') view.hidden = true;
          view.classList.remove('is-closing');
          closeTimers.delete(view);
        }, duration);
        closeTimers.set(view, timer);
      }
    });
    if (resetButton) resetButton.hidden = tab.id === 'battleTab';
    moveTo(tab, shouldAnimate);
  };

  tabs.forEach((tab) => tab.addEventListener('click', () => activate(tab)));
  const active = tabs.find((tab) => tab.getAttribute('aria-selected') === 'true') || tabs[0];
  requestAnimationFrame(() => moveTo(active, false));
  window.addEventListener('resize', () => moveTo(
    tabs.find((tab) => tab.getAttribute('aria-selected') === 'true') || tabs[0],
    false
  ));
}

function readCssDuration(element, propertyName) {
  const value = getComputedStyle(element).getPropertyValue(propertyName).trim();
  if (value.endsWith('ms')) return Number.parseFloat(value);
  if (value.endsWith('s')) return Number.parseFloat(value) * 1000;
  return 0;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
