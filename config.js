/**
 * BUSCA-RITMES · Configuració global de nivells
 * Compartit per: levels.html, game.html, tutorial.js
 */

const LEVELS = [
  {
    id: 0, name: 'Largo',      tempo: '♩ = 40',
    rows: 6,  cols: 6,  mines: 4,  cellPx: 68,
    desc: 'Primera nota',
    accent: '#3d8ef0', glow: 'rgba(61,142,240,.45)'
  },
  {
    id: 1, name: 'Adagio',     tempo: '♩ = 60',
    rows: 7,  cols: 7,  mines: 7,  cellPx: 60,
    desc: 'Passos segurs',
    accent: '#28c87a', glow: 'rgba(40,200,122,.45)'
  },
  {
    id: 2, name: 'Andante',    tempo: '♩ = 76',
    rows: 8,  cols: 8,  mines: 10, cellPx: 54,
    desc: 'Temps per pensar',
    accent: '#7ac840', glow: 'rgba(122,200,64,.45)'
  },
  {
    id: 3, name: 'Moderato',   tempo: '♩ = 100',
    rows: 9,  cols: 9,  mines: 14, cellPx: 50,
    desc: 'Equilibri perfecte',
    accent: '#d4a017', glow: 'rgba(212,160,23,.45)'
  },
  {
    id: 4, name: 'Allegretto', tempo: '♩ = 116',
    rows: 10, cols: 10, mines: 19, cellPx: 46,
    desc: 'La tensió augmenta',
    accent: '#f0a028', glow: 'rgba(240,160,40,.45)'
  },
  {
    id: 5, name: 'Allegro',    tempo: '♩ = 132',
    rows: 11, cols: 11, mines: 25, cellPx: 42,
    desc: 'Atenció total',
    accent: '#f06428', glow: 'rgba(240,100,40,.45)'
  },
  {
    id: 6, name: 'Vivace',     tempo: '♩ = 156',
    rows: 12, cols: 12, mines: 32, cellPx: 38,
    desc: 'Virtuosisme pur',
    accent: '#e03c3c', glow: 'rgba(224,60,60,.45)'
  },
  {
    id: 7, name: 'Presto',     tempo: '♩ = 184',
    rows: 14, cols: 14, mines: 45, cellPx: 32,
    desc: 'Màster del Silenci',
    accent: '#a028c8', glow: 'rgba(160,40,200,.45)'
  }
];

// Mode 1r ESO (?curs=1): 3 taulers petits, agògica de 1r, textos curts, rècords a part
const CURS1 = new URLSearchParams(location.search).get('curs') === '1';
const BR_KEY = CURS1 ? '_c1' : '';
if (CURS1) {
  LEVELS.length = 3;
  Object.assign(LEVELS[0], { name: 'Lento',   tempo: '♩ = 60',  desc: 'Lent i tranquil' });
  Object.assign(LEVELS[1], { name: 'Andante', tempo: '♩ = 80',  desc: 'Al pas, com qui camina' });
  Object.assign(LEVELS[2], { name: 'Allegro', tempo: '♩ = 110', desc: 'Ràpid i alegre' });
  const C1 = {
    '.landing-title': 'Cerca els silencis',
    '.landing-sub': 'Destapa les caselles. Les figures et diuen quants silencis hi ha a prop.',
    '.landing-pills span:nth-child(1)': '3 Nivells',
    '.landing-pills span:nth-child(2)': 'Lento → Allegro',
    '.lvl-header-txt p': 'De Lento a Allegro · 3 reptes',
    '.hint': 'Clic: destapa · Clic dret: posa la batuta'
  };
  document.addEventListener('DOMContentLoaded', () => {
    for (const [sel, t] of Object.entries(C1)) { const el = document.querySelector(sel); if (el) el.textContent = t; }
    // Enllaços interns: conserva ?curs=1
    document.querySelectorAll('a[href]').forEach(a => {
      const h = a.getAttribute('href');
      if (!h.includes('/')) a.setAttribute('href', h + (h.includes('?') ? '&' : '?') + 'curs=1');
    });
  });
}

function getBestTime(levelId) {
  return parseInt(localStorage.getItem(`br_best_${levelId}${BR_KEY}`) || '0');
}

function saveBestTime(levelId, seconds) {
  const prev = getBestTime(levelId);
  if (!prev || seconds < prev)
    localStorage.setItem(`br_best_${levelId}${BR_KEY}`, seconds);
}

function fmtTime(s) {
  if (!s) return '—';
  if (s < 60) return `${s}s`;
  return `${Math.floor(s/60)}m ${s%60}s`;
}
