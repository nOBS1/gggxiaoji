import { animate, stagger } from 'animejs';
import {
  CARD_SHEET,
  CARDS,
  RARITY_META,
  claimSupply,
  createInitialState,
  getCardById,
  getCardPower,
  getMaxStar,
  getOwnedCount,
  getSynthCost,
  getTotalPower,
  normalizeState,
  openPack,
  synthesizeAll,
  synthesizeCard
} from './cardGameCore.js';

const STORAGE_KEY = 'three-kingdoms-card-game-v1';
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

export class CardGame {
  constructor(root) {
    this.root = root;
    this.state = this.load();
    this.message = '拆卡包获得武将，重复卡可合成升星。';
    this.render({ type: 'initial' });
  }

  load() {
    try {
      return normalizeState(JSON.parse(localStorage.getItem(STORAGE_KEY)));
    } catch {
      return createInitialState();
    }
  }

  save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
  }

  reset() {
    this.state = createInitialState();
    this.message = '存档已重置，新的征途开始了。';
    this.save();
    this.render({ type: 'reset' });
  }

  render(effect = null) {
    this.root.innerHTML = `
      <div class="card-game">
        <section class="pack-panel">
          <div class="pack-art" aria-hidden="true">
            <div class="pack-art-image"></div>
            <div class="pack-seal">CARD PACK</div>
          </div>
          <div class="pack-actions">
            <div class="stats-grid">
              ${this.renderStat('卡包', this.state.packTickets)}
              ${this.renderStat('已拆', this.state.packsOpened)}
              ${this.renderStat('收集', `${getOwnedCount(this.state)}/${CARDS.length}`)}
              ${this.renderStat('战力', getTotalPower(this.state))}
            </div>
            <div class="action-row">
              <button class="primary-action" data-action="open-pack" type="button">拆一包</button>
              <button class="secondary-action" data-action="claim-supply" type="button">领取补给</button>
              <button class="secondary-action" data-action="synth-all" type="button">一键合成</button>
            </div>
            <p class="status-line">${this.message}</p>
          </div>
        </section>

        <section class="pull-panel" aria-label="最近拆包结果">
          <div class="section-heading">
            <span>本次战利品</span>
            <small>每包 ${this.state.lastPulls.length || 5} 张</small>
          </div>
          <div class="pull-strip">
            ${this.renderLastPulls()}
          </div>
        </section>

        <section class="collection-panel" aria-label="武将收藏">
          <div class="section-heading">
            <span>武将收藏</span>
            <small>${getSynthCost()} 张重复卡合成 1 星</small>
          </div>
          <div class="collection-grid">
            ${CARDS.map((card) => this.renderCollectionCard(card)).join('')}
          </div>
        </section>
      </div>
    `;

    this.bindEvents();
    this.bindTiltCards();
    this.playTransition(effect);
  }

  renderStat(label, value) {
    return `
      <div class="stat-card">
        <span>${label}</span>
        <strong>${value}</strong>
      </div>
    `;
  }

  renderLastPulls() {
    if (this.state.lastPulls.length === 0) {
      return `
        <div class="empty-pulls">
          <span>尚未拆包</span>
        </div>
      `;
    }

    return this.state.lastPulls
      .map((cardId) => {
        const card = getCardById(cardId);
        return `
          <article class="mini-card rarity-${card.rarity.toLowerCase()} faction-${card.faction}" data-pull-card-id="${card.id}" title="${card.name}">
            ${this.renderCardArt(card)}
            <div class="mini-card-info">
              <strong>${card.name}</strong>
              <span>${card.rarity}</span>
            </div>
          </article>
        `;
      })
      .join('');
  }

  renderCollectionCard(card) {
    const entry = this.state.collection[card.id];
    const ownedClass = entry.owned ? 'owned' : 'locked';
    const canSynth = entry.owned && entry.copies >= getSynthCost() && entry.star < getMaxStar();
    const stars = entry.owned ? '★'.repeat(entry.star) + '☆'.repeat(getMaxStar() - entry.star) : '未获得';

    return `
      <div class="hero-card-wrap t-tilt" data-card-id="${card.id}">
        <article class="hero-card t-tilt-card ${ownedClass} rarity-${card.rarity.toLowerCase()} faction-${card.faction}" data-card-id="${card.id}">
          <div class="card-ribbon">${RARITY_META[card.rarity].label}</div>
          ${this.renderCardArt(card)}
          <div class="hero-card-body">
            <div class="hero-card-title">
              <div>
                <h2>${card.name}</h2>
                <p>${card.title}</p>
              </div>
              <span>${card.faction}</span>
            </div>
            <div class="star-line">${stars}</div>
            <div class="card-meta">
              <span>${card.role}</span>
              <span>战力 ${getCardPower(card, entry)}</span>
              <span>重复 ${entry.copies}</span>
            </div>
            <p class="card-quote">${card.quote}</p>
            <button class="synth-button" data-action="synth" data-card-id="${card.id}" ${canSynth ? '' : 'disabled'} type="button">
              ${entry.star >= getMaxStar() ? '已满星' : '合成升星'}
            </button>
          </div>
          <div class="t-tilt-glare"></div>
        </article>
      </div>
    `;
  }

  renderCardArt(card) {
    const x = card.sheet.col * 50;
    const y = card.sheet.row * 100;

    return `
      <div
        class="card-art"
        style="background-image: url('${CARD_SHEET}'); background-position: ${x}% ${y}%;"
      ></div>
    `;
  }

  bindEvents() {
    this.root.querySelector('[data-action="open-pack"]')?.addEventListener('click', () => {
      const result = openPack(this.state);
      if (result.ok) {
        this.message = `拆开卡包：${result.cards.map((id) => getCardById(id).name).join('、')}`;
      } else {
        this.message = '卡包不足，先领取补给。';
      }
      this.save();
      this.render({ type: result.ok ? 'open-pack' : 'error' });
    });

    this.root.querySelector('[data-action="claim-supply"]')?.addEventListener('click', () => {
      const total = claimSupply(this.state);
      this.message = `补给已到，当前卡包 ${total} 个。`;
      this.save();
      this.render({ type: 'supply' });
    });

    this.root.querySelector('[data-action="synth-all"]')?.addEventListener('click', () => {
      const upgraded = synthesizeAll(this.state);
      this.message = upgraded > 0 ? `一键合成完成，共升星 ${upgraded} 次。` : '暂无可合成的武将。';
      this.save();
      this.render({ type: upgraded > 0 ? 'synth-all' : 'error' });
    });

    this.root.querySelectorAll('[data-action="synth"]').forEach((button) => {
      button.addEventListener('click', () => {
        const cardId = button.dataset.cardId;
        const result = synthesizeCard(this.state, cardId);
        const card = getCardById(cardId);
        this.message = result.ok ? `${card.name} 升星成功。` : '重复卡不足，继续拆包。';
        this.save();
        this.render({ type: result.ok ? 'synth' : 'error', cardId });
      });
    });
  }

  bindTiltCards() {
    const reduce = window.matchMedia?.(REDUCED_MOTION);
    const maxTilt = 10;

    this.root.querySelectorAll('.t-tilt').forEach((tilt) => {
      const card = tilt.querySelector('.t-tilt-card');
      if (!card) return;

      const reset = () => {
        tilt.classList.remove('is-hover');
        card.classList.remove('is-tilting');
        card.style.setProperty('--tilt-rx', '0deg');
        card.style.setProperty('--tilt-ry', '0deg');
      };

      const track = (event) => {
        if (reduce?.matches) return;
        const rect = tilt.getBoundingClientRect();
        const px = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
        const py = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));

        tilt.classList.add('is-hover');
        card.classList.add('is-tilting');
        card.style.setProperty('--tilt-ry', `${((px - 0.5) * maxTilt).toFixed(2)}deg`);
        card.style.setProperty('--tilt-rx', `${((0.5 - py) * maxTilt).toFixed(2)}deg`);
        card.style.setProperty('--tilt-gx', `${(px * 100).toFixed(1)}%`);
        card.style.setProperty('--tilt-gy', `${(py * 100).toFixed(1)}%`);
      };

      tilt.addEventListener('pointerdown', (event) => {
        if (event.pointerType !== 'mouse') {
          try {
            tilt.setPointerCapture(event.pointerId);
          } catch {
            // Pointer capture is best effort; the tilt still works without it.
          }
        }
      });
      tilt.addEventListener('pointermove', track);
      tilt.addEventListener('pointerup', reset);
      tilt.addEventListener('pointercancel', reset);
      tilt.addEventListener('pointerleave', (event) => {
        if (event.pointerType === 'mouse') reset();
      });
    });
  }

  playTransition(effect) {
    if (this.prefersReducedMotion()) return;

    const type = effect?.type;
    if (type === 'initial' || type === 'reset') {
      this.animateEntrance();
    }
    if (type === 'open-pack') {
      this.animatePackOpen();
    }
    if (type === 'supply') {
      this.animateSupply();
    }
    if (type === 'synth') {
      this.animateSynthesis(effect.cardId);
    }
    if (type === 'synth-all') {
      this.animateSynthesisAll();
    }
    if (type === 'error') {
      this.animateError();
    }
  }

  animateEntrance() {
    animate(this.root.querySelectorAll('.pack-panel, .pull-panel, .collection-panel'), {
      opacity: [0, 1],
      y: [18, 0],
      filter: ['blur(3px)', 'blur(0px)'],
      duration: this.motionMs('--duration-slow', 400),
      delay: stagger(this.motionMs('--duration-stagger', 40)),
      ease: 'out(3)'
    });
  }

  animatePackOpen() {
    animate(this.root.querySelector('.pack-art'), {
      scale: [1, 0.96, 1.03, 1],
      rotate: ['0deg', '-1deg', '1deg', '0deg'],
      duration: this.motionMs('--duration-very-slow', 500),
      ease: 'out(4)'
    });

    animate(this.root.querySelectorAll('.mini-card'), {
      opacity: [0, 1],
      y: [30, 0],
      scale: [0.86, 1],
      rotateY: ['-70deg', '0deg'],
      duration: 680,
      delay: stagger(70),
      ease: 'out(4)'
    });

    this.animateStatusLine();
  }

  animateSupply() {
    animate(this.root.querySelector('.pack-art'), {
      y: [0, -8, 0],
      scale: [1, 1.02, 1],
      duration: this.motionMs('--duration-slow', 400),
      ease: 'out(4)'
    });

    animate(this.root.querySelector('.stat-card'), {
      scale: [1, 1.12, 1],
      duration: this.motionMs('--duration-very-slow', 500),
      ease: 'out(4)'
    });

    this.animateStatusLine();
  }

  animateSynthesis(cardId) {
    const card = this.root.querySelector(`.hero-card[data-card-id="${cardId}"]`);
    if (!card) return;

    animate(card, {
      y: [0, -10, 0],
      scale: [1, 1.045, 1],
      filter: ['brightness(1)', 'brightness(1.18)', 'brightness(1)'],
      duration: 620,
      ease: 'out(4)'
    });

    animate(card.querySelector('.star-line'), {
      scale: [1, 1.3, 1],
      duration: this.motionMs('--duration-very-slow', 500),
      ease: 'out(4)'
    });

    this.animateStatusLine();
  }

  animateSynthesisAll() {
    animate(this.root.querySelectorAll('.hero-card.owned'), {
      y: [0, -8, 0],
      scale: [1, 1.035, 1],
      delay: stagger(this.motionMs('--duration-stagger', 40)),
      duration: 560,
      ease: 'out(4)'
    });

    this.animateStatusLine();
  }

  animateError() {
    animate(this.root.querySelector('.status-line'), {
      x: [0, -8, 8, -5, 5, 0],
      duration: this.motionMs('--duration-fast', 250),
      ease: 'inOut(3)'
    });
  }

  animateStatusLine() {
    animate(this.root.querySelector('.status-line'), {
      opacity: [0, 1],
      y: [6, 0],
      duration: this.motionMs('--duration-fast', 250),
      ease: 'out(3)'
    });
  }

  prefersReducedMotion() {
    return window.matchMedia?.(REDUCED_MOTION).matches;
  }

  motionMs(token, fallback) {
    const value = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
    if (value.endsWith('ms')) return Number.parseFloat(value);
    if (value.endsWith('s')) return Number.parseFloat(value) * 1000;
    return fallback;
  }
}
