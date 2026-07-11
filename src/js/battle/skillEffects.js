import { SKILLS } from './cardDefinitions.js';

const SKILL_EFFECTS = {
  [SKILLS.BENEVOLENT_COMMAND]: {
    onDeploy({ battle, side, position, commanderMaxHealth }) {
      const state = battle[side];
      state.commanderHealth = Math.min(commanderMaxHealth, state.commanderHealth + 3);
      state.battlefield.forEach((ally, allyPosition) => {
        if (!ally || allyPosition === position) return;
        ally.maxHealth += 1;
        ally.health += 1;
      });
    }
  },
  [SKILLS.WARRIOR_SAINT]: {
    onKill({ unit, turn }) {
      if (unit.skillState.refreshTurn === turn) return;
      unit.skillState.refreshTurn = turn;
      unit.attacksRemaining = 1;
    }
  },
  [SKILLS.ROARING_GUARD]: {
    onSurvivingDamage({ unit, damage }) {
      if (damage > 0 && unit.health > 0) unit.attack += 1;
    }
  },
  [SKILLS.CUNNING_PLAN]: {
    onDeploy({ battle, side, drawCard }) {
      drawCard();
      battle[side].nextCardDiscount += 1;
    }
  },
  [SKILLS.RISING_AMBITION]: {
    onFriendlyDefeated({ unit, count }) {
      unit.attack += count;
      unit.maxHealth += count;
      unit.health += count;
      unit.skillState.temporaryAttack = (unit.skillState.temporaryAttack || 0) + count;
      unit.skillState.temporaryHealth = (unit.skillState.temporaryHealth || 0) + count;
    },
    onTurnEnd({ unit }) {
      const temporaryAttack = unit.skillState.temporaryAttack || 0;
      const temporaryHealth = unit.skillState.temporaryHealth || 0;
      unit.attack -= temporaryAttack;
      unit.maxHealth -= temporaryHealth;
      unit.health = Math.min(unit.health, unit.maxHealth);
      unit.skillState.temporaryAttack = 0;
      unit.skillState.temporaryHealth = 0;
    }
  },
  [SKILLS.BALANCED_COMMAND]: {
    onDeploy({ battle, side }) {
      const formation = battle[side].battlefield.filter(Boolean);
      const roles = new Set(formation.map((ally) => ally.role));
      if (roles.size < 3) return;

      for (const ally of formation) {
        ally.attack += 1;
        ally.maxHealth += 1;
        ally.health += 1;
      }
    }
  }
};

export function applyDeploySkill(context) {
  const unit = context.battle[context.side].battlefield[context.position];
  SKILL_EFFECTS[unit.skill]?.onDeploy?.(context);
}

export function applyKillSkill(unit, turn) {
  SKILL_EFFECTS[unit.skill]?.onKill?.({ unit, turn });
}

export function applySurvivingDamageSkill(unit, damage) {
  SKILL_EFFECTS[unit.skill]?.onSurvivingDamage?.({ unit, damage });
}

export function applyFriendlyDefeatedSkill(unit, count) {
  SKILL_EFFECTS[unit.skill]?.onFriendlyDefeated?.({ unit, count });
}

export function applyTurnEndSkill(unit) {
  SKILL_EFFECTS[unit.skill]?.onTurnEnd?.({ unit });
}
