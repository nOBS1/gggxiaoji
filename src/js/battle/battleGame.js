import { animate, stagger } from 'animejs';
import { CARD_SHEET, getCardById } from '../cardGameCore.js';
import { runAiStep } from './battleAi.js';
import {
  attack,
  createBattle,
  endTurn,
  getEffectiveCardCost,
  getLegalAttackTargets,
  getPlayableHandCards,
  mulliganOpeningHand,
  playCard,
  startBattle
} from './battleCore.js';
import { getBattleCardDefinition } from './cardDefinitions.js';

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';
const AI_STEP_DELAY_MS = 520;
const AI_REDUCED_STEP_DELAY_MS = 320;
const PLAYER_DECK = [
  'liu-bei', 'liu-bei', 'guan-yu', 'guan-yu', 'zhang-fei', 'zhang-fei',
  'zhuge-liang', 'zhuge-liang', 'cao-cao', 'cao-cao', 'sun-quan', 'sun-quan'
];
const ENEMY_DECK = [
  'zhang-fei', 'zhang-fei', 'cao-cao', 'cao-cao', 'guan-yu', 'guan-yu',
  'liu-bei', 'liu-bei', 'sun-quan', 'sun-quan', 'zhuge-liang', 'zhuge-liang'
];

export class BattleGame {
  constructor(root) {
    this.root = root;
    this.screen = 'intro';
    this.battle = null;
    this.message = '虎牢关守军正在列阵。';
    this.selectedAttacker = null;
    this.aiPending = false;
    this.aiTimer = null;
    this.render({ type: 'intro' });
  }

  render(effect = null) {
    if (this.screen === 'intro') {
      this.root.innerHTML = this.renderIntro();
    } else if (this.screen === 'opening') {
      this.root.innerHTML = this.renderOpening();
    } else {
      this.root.innerHTML = this.renderBattle();
    }

    this.bindEvents();
    this.playTransition(effect);
  }

  renderIntro() {
    return `
      <section class="battle-intro" aria-labelledby="battleStageTitle">
        <div class="battle-intro-content">
          <p class="battle-eyebrow">第一战 · 演武试炼</p>
          <h2 id="battleStageTitle">虎牢关</h2>
          <div class="battle-opponent-line">
            <span>守将 吕布军</span>
            <span>主将生命 30</span>
            <span>三阵位</span>
          </div>
          <button class="battle-primary" data-action="new-battle" type="button">开始对战</button>
        </div>
      </section>
    `;
  }

  renderOpening() {
    const mulliganUsed = this.battle.player.mulliganUsed;
    return `
      <section class="battle-opening" aria-labelledby="openingTitle">
        <div class="opening-header">
          <p class="battle-eyebrow">虎牢关 · 起手整备</p>
          <h2 id="openingTitle">起手武将</h2>
        </div>
        <div class="opening-hand">
          ${this.battle.player.hand.map((card) => this.renderOpeningCard(card)).join('')}
        </div>
        <div class="opening-actions">
          <button class="battle-secondary" data-action="mulligan" type="button" ${mulliganUsed ? 'disabled' : ''}>
            ${mulliganUsed ? '已完成换牌' : '全量换牌'}
          </button>
          <button class="battle-primary" data-action="start-battle" type="button">进入战场</button>
        </div>
        <p class="battle-message" aria-live="polite">${this.message}</p>
      </section>
    `;
  }

  renderBattle() {
    const battle = this.battle;
    const isPlayerTurn = battle.activeSide === 'player' && !this.aiPending && !battle.winner;
    const selectedTargets = this.selectedAttacker === null
      ? { commander: false, positions: [] }
      : getLegalAttackTargets(battle, 'player', this.selectedAttacker);
    const canAttackCommander = isPlayerTurn && selectedTargets.commander;

    return `
      <section class="battle-stage" aria-label="虎牢关对战">
        <div class="battle-stage-shade" aria-hidden="true"></div>
        <div class="battle-layout">
          <header class="battle-hud enemy-hud">
            <button class="commander-crest enemy-crest ${canAttackCommander ? 'is-targetable' : ''}" data-action="attack-commander" type="button" ${canAttackCommander ? '' : 'disabled'}>
              <span>敌军主将</span>
              <strong>${battle.enemy.commanderHealth}</strong>
            </button>
            <div class="battle-counter"><span>手牌</span><strong>${battle.enemy.hand.length}</strong></div>
            <div class="battle-counter"><span>牌库</span><strong>${battle.enemy.deck.length}</strong></div>
          </header>

          ${this.renderBoard('enemy')}

          <div class="battle-turn-band">
            <div>
              <span>第 ${battle.round} 回合</span>
              <strong>${battle.winner ? '战斗结束' : this.aiPending ? '敌军行动' : isPlayerTurn ? '我方行动' : '敌军回合'}</strong>
            </div>
            <p class="battle-message" aria-live="polite">${this.message}</p>
          </div>

          ${this.renderBoard('player')}

          <footer class="battle-player-area">
            <div class="player-status">
              <div class="commander-crest player-crest">
                <span>我方主将</span>
                <strong>${battle.player.commanderHealth}</strong>
              </div>
              <div class="command-meter" aria-label="军令 ${battle.player.command}/${battle.player.maxCommand}">
                <span>军令</span>
                <strong>${battle.player.command}/${battle.player.maxCommand}</strong>
              </div>
            </div>
            <div class="battle-hand" aria-label="我方手牌">
              ${battle.player.hand.map((card) => this.renderHandCard(card, isPlayerTurn)).join('')}
            </div>
            <button class="end-turn-button" data-action="end-turn" type="button" ${isPlayerTurn ? '' : 'disabled'}>结束回合</button>
          </footer>
        </div>
        ${battle.winner ? this.renderOutcome() : ''}
      </section>
    `;
  }

  renderBoard(side) {
    const label = side === 'player' ? '我方战场' : '敌方战场';
    return `
      <div class="battle-board ${side}-board" aria-label="${label}">
        ${this.battle[side].battlefield
          .map((unit, position) => this.renderBoardSlot(side, unit, position))
          .join('')}
      </div>
    `;
  }

  renderBoardSlot(side, unit, position) {
    if (!unit) {
      return `<div class="battle-slot is-empty" aria-label="${side === 'player' ? '我方' : '敌方'}空阵位 ${position + 1}"><span>${position + 1}</span></div>`;
    }

    const isPlayer = side === 'player';
    const isSelected = isPlayer && this.selectedAttacker === position;
    const canSelect = isPlayer
      && this.battle.activeSide === 'player'
      && !this.aiPending
      && !this.battle.winner
      && unit.attacksRemaining > 0;
    const canTarget = !isPlayer && this.canTargetEnemy(position);
    const action = isPlayer ? 'select-attacker' : 'attack-unit';
    const isEnabled = isPlayer ? canSelect : canTarget;

    return `
      <button
        class="battle-slot battle-unit ${isSelected ? 'is-selected' : ''} ${canTarget ? 'is-targetable' : ''} faction-${unit.faction}"
        data-action="${action}"
        data-position="${position}"
        type="button"
        ${isEnabled ? '' : 'disabled'}
        ${isPlayer ? `aria-pressed="${isSelected}"` : ''}
      >
        ${this.renderArt(unit.cardId)}
        <span class="unit-name">${unit.name}</span>
        <span class="unit-role">${unit.role}</span>
        <span class="unit-stats"><b>${unit.attack}</b><b>${unit.health}</b></span>
        ${unit.keywords.includes('taunt') ? '<span class="unit-keyword">嘲讽</span>' : ''}
      </button>
    `;
  }

  renderHandCard(card, isPlayerTurn) {
    const definition = getBattleCardDefinition(card.cardId);
    const cost = getEffectiveCardCost(this.battle, 'player', card);
    const playable = isPlayerTurn && getPlayableHandCards(this.battle, 'player')
      .some((item) => item.instanceId === card.instanceId);

    return `
      <button class="battle-hand-card rarity-${definition.rarity.toLowerCase()}" data-action="play-card" data-instance-id="${card.instanceId}" type="button" ${playable ? '' : 'disabled'}>
        <span class="hand-cost">${cost}</span>
        ${this.renderArt(card.cardId)}
        <span class="hand-card-name">${definition.name}</span>
        <span class="hand-card-skill">${definition.skillName}</span>
        <span class="hand-card-stats"><b>${definition.attack}</b><b>${definition.health}</b></span>
      </button>
    `;
  }

  renderOpeningCard(card) {
    const definition = getBattleCardDefinition(card.cardId);
    return `
      <article class="opening-card rarity-${definition.rarity.toLowerCase()}">
        <span class="hand-cost">${definition.cost}</span>
        ${this.renderArt(card.cardId)}
        <div>
          <strong>${definition.name}</strong>
          <span>${definition.role}</span>
          <p>${definition.skillText}</p>
        </div>
      </article>
    `;
  }

  renderArt(cardId) {
    const card = getCardById(cardId);
    const x = card.sheet.col * 50;
    const y = card.sheet.row * 100;
    return `<span class="battle-card-art" style="background-image:url('${CARD_SHEET}');background-position:${x}% ${y}%"></span>`;
  }

  renderOutcome() {
    const won = this.battle.winner === 'player';
    return `
      <div class="battle-outcome" role="dialog" aria-modal="true" aria-labelledby="outcomeTitle">
        <div class="battle-outcome-panel">
          <p class="battle-eyebrow">虎牢关 · 战报</p>
          <h2 id="outcomeTitle">${won ? '演武告捷' : '败阵整军'}</h2>
          <strong>${won ? '敌军主将已败' : '我方主将已败'}</strong>
          <button class="battle-primary" data-action="new-battle" type="button">再战一局</button>
        </div>
      </div>
    `;
  }

  bindEvents() {
    this.root.querySelector('[data-action="new-battle"]')?.addEventListener('click', () => this.newBattle());
    this.root.querySelector('[data-action="mulligan"]')?.addEventListener('click', () => this.mulligan());
    this.root.querySelector('[data-action="start-battle"]')?.addEventListener('click', () => this.beginBattle());
    this.root.querySelector('[data-action="end-turn"]')?.addEventListener('click', () => this.finishPlayerTurn());
    this.root.querySelector('[data-action="attack-commander"]')?.addEventListener('click', () => this.attackCommander());

    this.root.querySelectorAll('[data-action="play-card"]').forEach((button) => {
      button.addEventListener('click', () => this.playHandCard(button.dataset.instanceId));
    });
    this.root.querySelectorAll('[data-action="select-attacker"]').forEach((button) => {
      button.addEventListener('click', () => this.selectAttacker(Number(button.dataset.position)));
    });
    this.root.querySelectorAll('[data-action="attack-unit"]').forEach((button) => {
      button.addEventListener('click', () => this.attackUnit(Number(button.dataset.position)));
    });
  }

  newBattle() {
    if (this.aiTimer) clearTimeout(this.aiTimer);
    this.battle = createBattle({ playerDeck: PLAYER_DECK, enemyDeck: ENEMY_DECK });
    this.screen = 'opening';
    this.selectedAttacker = null;
    this.aiPending = false;
    this.message = '军令已下，检视起手武将。';
    this.render({ type: 'opening' });
  }

  mulligan() {
    const result = mulliganOpeningHand(this.battle, 'player');
    this.battle = result.battle;
    this.message = result.ok ? '起手已更换。' : '本局已经换过起手。';
    this.render({ type: result.ok ? 'mulligan' : 'error' });
  }

  beginBattle() {
    const result = startBattle(this.battle);
    this.battle = result.battle;
    this.screen = 'battle';
    this.message = '我方回合。';
    this.render({ type: 'battle-start' });
  }

  playHandCard(instanceId) {
    const position = this.battle.player.battlefield.findIndex((unit) => unit === null);
    const card = this.battle.player.hand.find((item) => item.instanceId === instanceId);
    const result = playCard(this.battle, 'player', instanceId, position);
    this.battle = result.battle;
    this.message = result.ok ? `${getBattleCardDefinition(card.cardId).name}登场。` : '当前无法打出这张牌。';
    this.selectedAttacker = null;
    this.render({ type: result.ok ? 'deploy' : 'error' });
  }

  selectAttacker(position) {
    this.selectedAttacker = this.selectedAttacker === position ? null : position;
    const unit = this.battle.player.battlefield[position];
    this.message = this.selectedAttacker === null ? '已取消进攻。' : `${unit.name}待命。`;
    this.render({ type: 'select' });
  }

  attackUnit(position) {
    if (this.selectedAttacker === null) return;
    const target = this.battle.enemy.battlefield[position];
    const attackerPosition = this.selectedAttacker;
    const result = attack(this.battle, 'player', attackerPosition, { type: 'unit', position });
    this.battle = result.battle;
    this.message = result.ok ? `向${target.name}发动攻击。` : this.attackErrorMessage(result.reason);
    const attacker = this.battle.player.battlefield[attackerPosition];
    this.selectedAttacker = result.ok && attacker?.attacksRemaining > 0 ? attackerPosition : null;
    this.render({ type: result.ok ? 'attack' : 'error' });
  }

  attackCommander() {
    if (this.selectedAttacker === null) return;
    const attackerPosition = this.selectedAttacker;
    const result = attack(this.battle, 'player', attackerPosition, { type: 'commander' });
    this.battle = result.battle;
    this.message = result.ok ? `敌军主将受到 ${result.damageToCommander} 点伤害。` : this.attackErrorMessage(result.reason);
    const attacker = this.battle.player.battlefield[attackerPosition];
    this.selectedAttacker = result.ok && attacker?.attacksRemaining > 0 ? attackerPosition : null;
    this.render({ type: result.ok ? 'attack' : 'error' });
  }

  finishPlayerTurn() {
    const result = endTurn(this.battle);
    if (!result.ok) return;
    this.battle = result.battle;
    this.selectedAttacker = null;
    this.aiPending = true;
    this.message = '敌军调兵中。';
    this.render({ type: 'enemy-turn' });
    this.aiTimer = setTimeout(() => this.finishAiStep(), this.aiStepDelay());
  }

  finishAiStep() {
    const result = runAiStep(this.battle);
    if (!result.ok) {
      this.aiPending = false;
      this.message = '敌军结束行动。';
      this.render({ type: 'player-turn' });
      return;
    }

    this.battle = result.battle;
    this.message = this.describeAiAction(result.action);
    const effectType = result.action.type === 'deploy'
      ? 'ai-deploy'
      : result.action.type === 'attack'
        ? 'ai-attack'
        : 'player-turn';

    if (result.done || this.battle.winner) {
      this.aiPending = false;
      this.render({ type: effectType });
      return;
    }

    this.render({ type: effectType });
    this.aiTimer = setTimeout(() => this.finishAiStep(), this.aiStepDelay());
  }

  canTargetEnemy(position) {
    if (this.selectedAttacker === null || this.aiPending) return false;
    return getLegalAttackTargets(this.battle, 'player', this.selectedAttacker)
      .positions.includes(position);
  }

  describeAiAction(action) {
    if (action.type === 'deploy') {
      return `敌军${getBattleCardDefinition(action.cardId).name}登场。`;
    }
    if (action.type === 'attack') {
      const attacker = getBattleCardDefinition(action.cardId).name;
      const target = action.target.type === 'commander'
        ? '我方主将'
        : getBattleCardDefinition(action.targetCardId).name;
      return `${attacker}向${target}发动攻击。`;
    }
    return this.battle.winner ? '战斗结束。' : '敌军回合结束。';
  }

  attackErrorMessage(reason) {
    if (reason === 'TAUNT_PRESENT') return '敌军嘲讽武将挡住了进攻。';
    if (reason === 'NO_ATTACKS_REMAINING') return '该武将本回合已经行动。';
    return '当前目标无法攻击。';
  }

  playTransition(effect) {
    if (this.prefersReducedMotion()) return;
    const type = effect?.type;
    if (type === 'intro') {
      animate(this.root.querySelector('.battle-intro-content'), {
        opacity: [0, 1],
        y: [18, 0],
        duration: 500,
        ease: 'out(4)'
      });
    }
    if (type === 'opening' || type === 'mulligan') {
      animate(this.root.querySelectorAll('.opening-card'), {
        opacity: [0, 1],
        y: [24, 0],
        rotateY: ['-35deg', '0deg'],
        delay: stagger(55),
        duration: 520,
        ease: 'out(4)'
      });
    }
    if (type === 'battle-start' || type === 'player-turn') {
      animate(this.root.querySelectorAll('.battle-hud, .battle-board, .battle-player-area'), {
        opacity: [0, 1],
        y: [12, 0],
        delay: stagger(35),
        duration: 420,
        ease: 'out(3)'
      });
    }
    if (type === 'deploy' || type === 'attack' || type === 'ai-deploy' || type === 'ai-attack') {
      animate(this.root.querySelectorAll('.battle-unit'), {
        scale: [0.96, 1],
        duration: 250,
        ease: 'out(3)'
      });
    }
    if (type === 'error') {
      animate(this.root.querySelector('.battle-message'), {
        x: [0, -6, 6, -4, 4, 0],
        duration: 250,
        ease: 'inOut(3)'
      });
    }
  }

  prefersReducedMotion() {
    return window.matchMedia?.(REDUCED_MOTION).matches;
  }

  aiStepDelay() {
    return this.prefersReducedMotion() ? AI_REDUCED_STEP_DELAY_MS : AI_STEP_DELAY_MS;
  }
}
