// 2026 WC format: 12 groups × 4 teams → top 2 from each + 8 best 3rd place = 32 teams in R32
// Pairing: group winner vs runner-up from opposing group

const SEED_ORDER = [
  ['A','B'], ['C','D'], ['E','F'], ['G','H'],
  ['I','J'], ['K','L'],
  // 8 best 3rd-place teams fill remaining slots (approximated by cross-pairing)
  ['A','C'], ['B','D'], ['E','G'], ['F','H'],
  ['I','K'], ['J','L'],
  ['A','E'], ['B','F'],
];

const ROUND_NAMES = ['Round of 32', 'Round of 16', 'Quarter-Finals', 'Semi-Finals', 'Final'];

// State
let bracket = [];      // bracket[round][matchIndex] = { home, away, winner }
let initialized = false;

// --- Build initial R32 from group results ---
function buildR32() {
  const byGroup = {};
  TEAMS.forEach(t => {
    if (!byGroup[t.group]) byGroup[t.group] = [];
    byGroup[t.group].push(t);
  });

  const r32 = [];
  SEED_ORDER.forEach(([g1, g2]) => {
    const t1 = byGroup[g1]?.[0];
    const t2 = byGroup[g2]?.[1] ?? byGroup[g2]?.[0];
    r32.push({ home: t1 ?? null, away: t2 ?? null, winner: null });
  });
  return r32;
}

function initBracket() {
  bracket = [];
  bracket[0] = buildR32();
  for (let r = 1; r < ROUND_NAMES.length; r++) {
    const prevCount = bracket[r - 1].length;
    bracket[r] = Array.from({ length: Math.ceil(prevCount / 2) }, () => ({
      home: null, away: null, winner: null
    }));
  }
  initialized = true;
}

// --- Pick winner for a match ---
function pickWinner(round, matchIdx, team) {
  bracket[round][matchIdx].winner = team;
  propagate(round, matchIdx, team);
  renderBracket();
  checkChampion();
}

function propagate(round, matchIdx, team) {
  const nextRound = round + 1;
  if (nextRound >= ROUND_NAMES.length) return;
  const nextMatch = Math.floor(matchIdx / 2);
  const slot = matchIdx % 2 === 0 ? 'home' : 'away';
  // clear winner of next match if it changes
  if (bracket[nextRound][nextMatch][slot]?.id !== team?.id) {
    bracket[nextRound][nextMatch].winner = null;
    clearAhead(nextRound, nextMatch);
  }
  bracket[nextRound][nextMatch][slot] = team;
}

function clearAhead(round, matchIdx) {
  const nextRound = round + 1;
  if (nextRound >= ROUND_NAMES.length) return;
  const nextMatch = Math.floor(matchIdx / 2);
  const slot = matchIdx % 2 === 0 ? 'home' : 'away';
  bracket[nextRound][nextMatch][slot] = null;
  bracket[nextRound][nextMatch].winner = null;
  clearAhead(nextRound, nextMatch);
}

// --- Simulate remaining unpicked matches randomly ---
function simulateAll() {
  for (let r = 0; r < ROUND_NAMES.length; r++) {
    bracket[r].forEach((match, idx) => {
      if (!match.winner && match.home && match.away) {
        const winner = Math.random() < 0.5 ? match.home : match.away;
        bracket[r][idx].winner = winner;
        propagate(r, idx, winner);
      }
    });
  }
  renderBracket();
  checkChampion();
}

function reset() {
  initBracket();
  document.getElementById('champion-banner').classList.add('hidden');
  renderBracket();
}

function checkChampion() {
  const final = bracket[ROUND_NAMES.length - 1][0];
  if (final?.winner) {
    const b = document.getElementById('champion-banner');
    b.innerHTML = `
      <div class="champ-inner">
        <div class="champ-trophy">🏆</div>
        <div class="champ-label">WORLD CHAMPION 2026</div>
        <div class="champ-flag">${final.winner.flag}</div>
        <div class="champ-name">${final.winner.name}</div>
      </div>`;
    b.classList.remove('hidden');
  }
}

// --- Render ---
function renderBracket() {
  const wrap = document.getElementById('bracket-wrap');
  wrap.innerHTML = '';

  ROUND_NAMES.forEach((rName, rIdx) => {
    const col = document.createElement('div');
    col.className = 'bracket-col';

    const label = document.createElement('div');
    label.className = 'round-label';
    label.textContent = rName;
    col.appendChild(label);

    const matchesWrap = document.createElement('div');
    matchesWrap.className = 'matches-wrap';

    bracket[rIdx].forEach((match, mIdx) => {
      const card = document.createElement('div');
      card.className = 'match-card';

      [match.home, match.away].forEach((team, ti) => {
        const slot = document.createElement('div');
        slot.className = 'match-slot' +
          (match.winner && match.winner?.id === team?.id ? ' winner' : '') +
          (match.winner && match.winner?.id !== team?.id && team ? ' loser' : '') +
          (!team ? ' empty' : '');

        if (team) {
          slot.innerHTML = `<span class="ms-flag">${team.flag}</span><span class="ms-name">${team.name}</span>`;
          if (!match.winner) {
            slot.title = `Click to pick ${team.name}`;
            slot.addEventListener('click', () => pickWinner(rIdx, mIdx, team));
          }
        } else {
          slot.innerHTML = `<span class="ms-tbd">TBD</span>`;
        }

        card.appendChild(slot);
        if (ti === 0) {
          const vs = document.createElement('div');
          vs.className = 'match-vs';
          vs.textContent = 'vs';
          card.appendChild(vs);
        }
      });

      matchesWrap.appendChild(card);
    });

    col.appendChild(matchesWrap);
    wrap.appendChild(col);
  });
}

// Hook up buttons
document.getElementById('btn-random').addEventListener('click', simulateAll);
document.getElementById('btn-reset').addEventListener('click', reset);

// Init on bracket page open
const origShowPage = window.__showPage;
document.querySelector('[data-page="bracket"]').addEventListener('click', () => {
  if (!initialized) { initBracket(); renderBracket(); }
});

// auto-init if bracket page is shown directly
if (!initialized) { initBracket(); }
