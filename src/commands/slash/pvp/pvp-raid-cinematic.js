// src/commands/slash/pvp/pvp-raid-cinematic.js
// A self-contained PvP Raid command focused on *clarity & presentation*.
// - Two teams shown side-by-side
// - Clean effect explanations (name, stacks, remaining turns)
// - Short, readable battle log
// - Optional lightweight "animation" by editing the same message per turn

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

// ======== Config ========
const ANIMATED = true;               // If true, edits the message per turn to feel animated
const ANIM_DELAY_MS = 900;           // Delay between frames (ms)
const MAX_TURNS = 30;                // Safety cap
const COLOR_LEFT = 0x00c2ff;
const COLOR_RIGHT = 0xff7a00;
const COLOR_NEUTRAL = 0x2b2d31;

// ======== Demo Data (drop-in working) ========
function demoState() {
  return {
    turn: 1,
    left: [{
      id: "Luffy",
      name: "Luffy",
      emoji: "🧢",
      maxHP: 220, currentHP: 220,
      atk: 42, def: 15, spd: 18, crit: 0.15,
      statusEffects: []
    }],
    right: [{
      id: "Kaido",
      name: "Kaido",
      emoji: "🐉",
      maxHP: 260, currentHP: 260,
      atk: 47, def: 18, spd: 14, crit: 0.12,
      statusEffects: []
    }],
    log: []
  };
}

// ======== Effect helpers (simple, readable) ========
function addEffect(target, eff, log, turn, who = "") {
  if (!target.statusEffects) target.statusEffects = [];
  const id = eff.name.toLowerCase();
  const found = target.statusEffects.find(e => (e.name || "").toLowerCase() === id);

  if (found) {
    // stacking or refresh by default
    if ((eff.maxStacks || 1) > 1) {
      found.stacks = Math.min((found.stacks || 1) + (eff.stacks || 1), eff.maxStacks);
      log.push(`↗️ ${who}${target.name} gains a stack of ${eff.name} (x${found.stacks}).`);
    }
    found.duration = Math.max(found.duration, eff.duration);
    if (eff.damage) found.damage = Math.max(found.damage || 0, eff.damage);
  } else {
    target.statusEffects.push({
      name: eff.name,
      icon: eff.icon || '⭐',
      type: eff.type || 'buff',         // 'buff' | 'debuff' | 'dot' | 'hot' | 'shield'
      duration: eff.duration ?? 2,
      stacks: eff.stacks || 1,
      maxStacks: eff.maxStacks || 1,
      damage: eff.damage || 0,
      atkPct: eff.atkPct || 0,
      defPct: eff.defPct || 0,
      dmgDealtPct: eff.dmgDealtPct || 0,
      dmgTakenPct: eff.dmgTakenPct || 0,
      shield: eff.shield || 0
    });
    log.push(`✨ ${who}${target.name} gains ${eff.icon || '⭐'} ${eff.name} (${eff.duration}t).`);
  }
}

function processEffectsStartOfTurn(unit, log, turn, who="") {
  // HOT/DOT tick at start
  let dot = 0, hot = 0;
  for (const e of (unit.statusEffects || [])) {
    if (e.type === 'dot' && e.damage > 0) {
      dot += e.damage * (e.stacks || 1);
      log.push(`${e.icon || '☠️'} ${who}${unit.name} suffers ${e.damage * (e.stacks||1)} from ${e.name}.`);
    }
    if (e.type === 'hot' && e.damage > 0) {
      hot += e.damage * (e.stacks || 1);
      log.push(`✨ ${who}${unit.name} heals ${e.damage * (e.stacks||1)} from ${e.name}.`);
    }
  }
  if (dot) unit.currentHP = Math.max(0, unit.currentHP - dot);
  if (hot) unit.currentHP = Math.min(unit.maxHP, unit.currentHP + hot);
}

function processEffectsEndOfTurn(unit, log, turn, who="") {
  // decay duration and expire
  if (!unit.statusEffects) return;
  for (let i = unit.statusEffects.length - 1; i >= 0; i--) {
    unit.statusEffects[i].duration -= 1;
    if (unit.statusEffects[i].duration <= 0) {
      log.push(`⏹️ ${who}${unit.name}'s ${unit.statusEffects[i].name} expired.`);
      unit.statusEffects.splice(i, 1);
    }
  }
}

function effectList(unit) {
  if (!unit.statusEffects || unit.statusEffects.length === 0) return "—";
  return unit.statusEffects.map(e => {
    const dur = `${e.duration}t`;
    const stack = (e.maxStacks > 1 && e.stacks > 1) ? ` x${e.stacks}` : "";
    const parts = [];
    if (e.atkPct) parts.push(`ATK ${fmtPct(e.atkPct)}`);
    if (e.defPct) parts.push(`DEF ${fmtPct(e.defPct)}`);
    if (e.dmgDealtPct) parts.push(`DMG Dealt ${fmtPct(e.dmgDealtPct)}`);
    if (e.dmgTakenPct) parts.push(`DMG Taken ${fmtPct(e.dmgTakenPct)}`);
    if (e.shield) parts.push(`Shield ${e.shield}`);
    if (e.type === 'dot' && e.damage) parts.push(`DOT ${e.damage}/t`);
    if (e.type === 'hot' && e.damage) parts.push(`HOT ${e.damage}/t`);
    const desc = parts.length ? ` — ${parts.join(', ')}` : "";
    return `${e.icon || '⭐'} ${e.name}${stack} (${dur})${desc}`;
  }).join("\n");
}

function fmtPct(v){ return (v>=0?"+":"") + Math.round(v*100) + "%"; }

// ======== Damage & Shields ========
function getMods(unit) {
  let atkPct=0, defPct=0, dealt=0, taken=0;
  for (const e of (unit.statusEffects || [])) {
    atkPct += e.atkPct || 0;
    defPct += e.defPct || 0;
    dealt += e.dmgDealtPct || 0;
    taken += e.dmgTakenPct || 0;
  }
  return { atkPct, defPct, dealt, taken };
}

function applyShields(unit, incoming, log, turn, who="") {
  let dmg = incoming;
  for (const e of (unit.statusEffects || [])) {
    if (e.shield && e.shield > 0) {
      const absorbed = Math.min(e.shield, dmg);
      e.shield -= absorbed;
      dmg -= absorbed;
      log.push(`🛡️ ${who}${unit.name}'s ${e.name} absorbed ${absorbed}.`);
      if (dmg <= 0) break;
    }
  }
  return Math.max(0, Math.floor(dmg));
}

function dealDamage(attacker, defender, base, log, turn) {
  const a = getMods(attacker);
  const d = getMods(defender);
  const raw = Math.max(1, Math.floor((attacker.atk * (1 + a.atkPct)) * base - (defender.def * (1 + d.defPct))));
  const mult = (1 + a.dealt) * (1 + d.taken);
  const preShield = Math.max(1, Math.floor(raw * mult));
  const postShield = applyShields(defender, preShield, log, turn, "");
  defender.currentHP = Math.max(0, defender.currentHP - postShield);
  log.push(`⚔️ ${attacker.name} hits ${defender.name} for **${postShield}** (raw ${preShield}).`);
}

// ======== Rendering ========
function hpBar(unit, size = 22) {
  const ratio = Math.max(0, Math.min(1, unit.currentHP / unit.maxHP));
  const filled = Math.round(ratio * size);
  return "█".repeat(filled) + "░".repeat(size - filled);
}

function unitCard(unit) {
  const hpPercent = Math.round((unit.currentHP / unit.maxHP) * 100);
  return `${unit.emoji} **${unit.name}**\n\`${hpBar(unit)}\` **${hpPercent}%** (${unit.currentHP}/${unit.maxHP})\n**Effects**\n${effectList(unit)}`;
}

function frameEmbed(state, title="Battle") {
  const leftUnit = state.left.find(u => u.currentHP > 0) || state.left[0];
  const rightUnit = state.right.find(u => u.currentHP > 0) || state.right[0];

  return new EmbedBuilder()
    .setTitle(`🎮 ${title}`)
    .setDescription(`Turn ${state.turn}`)
    .addFields(
      { name: "🜁 Team A", value: unitCard(leftUnit), inline: true },
      { name: "🜂 Team B", value: unitCard(rightUnit), inline: true },
      { name: "Log", value: state.log.slice(-8).join("\n") || "—", inline: false }
    )
    .setColor(COLOR_NEUTRAL);
}

// ======== Turn logic (simple & readable) ========
function alive(team) { return team.some(u => u.currentHP > 0); }
function nextActor(state) {
  const a = state.left.find(u => u.currentHP > 0);
  const b = state.right.find(u => u.currentHP > 0);
  // SPD check: higher goes first each turn; alternate by side
  return (state.turn % 2 === 1)
    ? (a.spd >= b.spd ? { actor:a, target:b, side:"A" } : { actor:b, target:a, side:"B" })
    : (a.spd >= b.spd ? { actor:b, target:a, side:"B" } : { actor:a, target:b, side:"A" });
}

async function runTurn(state) {
  const { actor, target, side } = nextActor(state);

  state.log.push(`\n**TURN ${state.turn} — ${actor.name}**`);
  processEffectsStartOfTurn(actor, state.log, state.turn, "");

  if (actor.currentHP > 0 && target.currentHP > 0) {
    // Choose a simple skill by HP state
    const useBuff = actor.currentHP < actor.maxHP * 0.4 && actor.statusEffects.every(e => e.type !== 'hot');
    if (useBuff) {
      addEffect(actor, { name: "Guard Up", icon: "🛡️", type:"buff", duration: 2, defPct: 0.25 }, state.log, state.turn);
      state.log.push(`📣 ${actor.name} uses **Guard Up**.`);
    } else {
      addEffect(target, { name: "Burn", icon:"🔥", type:"dot", duration: 2, maxStacks:3, stacks:1, damage: 8 }, state.log, state.turn);
      state.log.push(`🔥 ${actor.name} applies **Burn** to ${target.name}.`);
      dealDamage(actor, target, 1.1, state.log, state.turn);
    }
  }

  processEffectsEndOfTurn(actor, state.log, state.turn, "");
  state.turn++;
}

async function runBattleCinematic(interaction) {
  const state = demoState();
  if (!ANIMATED) {
    // non-animated: compute all, then show final
    while (alive(state.left) && alive(state.right) && state.turn <= MAX_TURNS) {
      await runTurn(state);
    }
    const result = alive(state.left) && !alive(state.right) ? "Team A wins"
                : alive(state.right) && !alive(state.left) ? "Team B wins"
                : "Draw";

    const finalEmbed = frameEmbed(state, `Result: ${result}`);
    await interaction.reply({ embeds: [finalEmbed] });
    return;
  }

  // animated: send one frame, then edit per turn
  let msg = await interaction.reply({ embeds: [frameEmbed(state, "Ready")] });

  while (alive(state.left) && alive(state.right) && state.turn <= MAX_TURNS) {
    await runTurn(state);
    await waitMs(ANIM_DELAY_MS);
    await msg.edit({ embeds: [frameEmbed(state, "Battle")] });
  }

  const result = alive(state.left) && !alive(state.right) ? "Team A wins"
              : alive(state.right) && !alive(state.left) ? "Team B wins"
              : "Draw";
  await waitMs(ANIM_DELAY_MS);
  await msg.edit({ embeds: [frameEmbed(state, `Result: ${result}`)] });
}

function waitMs(ms){ return new Promise(res => setTimeout(res, ms)); }

// =============== Slash command export ===============
module.exports = {
  data: new SlashCommandBuilder()
    .setName('pvp-raid-cinematic')
    .setDescription('Clean, game-like PvP raid with readable effects and lightweight animation.'),
  async execute(interaction) {
    try {
      await runBattleCinematic(interaction);
    } catch (e) {
      console.error(e);
      const err = new EmbedBuilder()
        .setTitle('Error')
        .setDescription('Something went wrong running the cinematic PvP raid.')
        .setColor(0xcc0000);
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ embeds: [err] }).catch(()=>{});
      } else {
        await interaction.reply({ embeds: [err], ephemeral: true }).catch(()=>{});
      }
    }
  }
};
